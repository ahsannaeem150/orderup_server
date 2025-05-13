import { Server } from "socket.io";
import { orderModel } from "../models/orderModel.js";
import jwt from "jsonwebtoken";
import { OrderHistoryModel } from "../models/orderHistoryModel.js";
import { agentModel } from "../models/agentModel.js";
import mongoose from "mongoose";
import { DeliveryTrackingModel } from "../models/deliveryTrackingModel.js";

const setupChangeStream = async (io) => {
  try {
    console.log("Attempting to start change stream");
    const changeStream = orderModel.watch([], {
      fullDocument: "updateLookup",
      readPreference: "primary",
    });
    console.log("Change stream initialized successfully");

    changeStream.on("change", async (change) => {
      try {
        console.log(change.operationType);
        let order = [];
        if (["insert", "update"].includes(change.operationType)) {
          order = await orderModel
            .findById(change.documentKey._id)
            .populate("user", "_id name phone profilePicture")
            .populate("restaurant", "_id name address logo")
            .populate(
              "agentRequests.agent",
              "_id firstName lastName profilePicture username phone"
            )
            .lean();
        }
        const restaurantId =
          order?.restaurant?._id?.toString() || order?.restaurant?.toString();
        const userId = order?.user?._id?.toString();
        console.log(change.documentKey._id);
        switch (change.operationType) {
          case "insert":
            io.of("/restaurant").to(restaurantId).emit("order-created", order);
            io.of("/user").to(userId).emit("order-created", order);
            break;

          case "update":
            io.of("/restaurant").to(restaurantId).emit("order-updated", order);
            io.of("/user").to(userId).emit("order-updated", order);
            break;
        }
      } catch (error) {
        console.error("Error processing change event:", error);
      }
    });

    changeStream.on("error", (error) => {
      console.error("Change Stream error:", error);
      setTimeout(() => setupChangeStream(io), 5000);
    });
  } catch (err) {
    console.error("Change Stream connection failed:", err);
    setTimeout(() => setupChangeStream(io), 5000);
  }
};

const setupDeliveryTrackingChangeStream = async (io) => {
  try {
    console.log("Starting DeliveryTracking change stream");
    const changeStream = DeliveryTrackingModel.watch([], {
      fullDocument: "updateLookup",
    });

    changeStream.on("change", async (change) => {
      try {
        if (
          change.operationType === "update" &&
          change.updateDescription.updatedFields.path
        ) {
          const tracking = change.fullDocument;
          if (!tracking || !tracking.active) return;

          const order = await orderModel
            .findById(tracking.order)
            .select("user restaurant status")
            .lean();

          if (!order || order.status === "Completed") return;

          const latestLocation = tracking.path[tracking.path.length - 1];

          io.of("/user").to(order.user.toString()).emit("location-update", {
            orderId: tracking.order.toString(),
            location: latestLocation,
          });

          io.of("/restaurant")
            .to(order.restaurant.toString())
            .emit("location-update", {
              orderId: tracking.order.toString(),
              location: latestLocation,
            });

          io.of("/agent")
            .to(tracking.agent.toString())
            .emit("location-update", {
              orderId: tracking.order.toString(),
              location: latestLocation,
            });
        }
      } catch (error) {
        console.error("Error processing tracking change:", error);
      }
    });

    changeStream.on("error", (error) => {
      console.error("DeliveryTracking Change Stream error:", error);
      setTimeout(() => setupDeliveryTrackingChangeStream(io), 5000);
    });
  } catch (err) {
    console.error("DeliveryTracking Change Stream connection failed:", err);
    setTimeout(() => setupDeliveryTrackingChangeStream(io), 5000);
  }
};

const socketIoSetup = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  setupChangeStream(io);
  setupDeliveryTrackingChangeStream(io);

  // Authentication middleware
  const authenticate = (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error("Authentication error:", err);
      next(new Error("Authentication failed"));
    }
  };

  // User namespace
  const userNamespace = io.of("/user");
  userNamespace.use(authenticate);
  userNamespace.on("connection", (socket) => {
    console.log(`"User connected:" ${socket.user._id}`.bgRed.white);

    socket.on("join-user-room", (userId) => {
      if (userId !== socket.user._id) {
        console.log("ERROR USER CONNECTION");
        return socket.emit("error", "Unauthorized room access");
      }
      socket.join(userId);
    });

    socket.on("cancel-order", async ({ orderId, cancellationReason }) => {
      try {
        const order = await orderModel.findById(orderId);
        if (!order || order.user.toString() !== socket.user._id.toString()) {
          console.log("ERROR", "Invalid order cancellation");
          return socket.emit("order-error", "Invalid order cancellation");
        }
        const historyOrder = new OrderHistoryModel({
          ...order.toObject(),
          status: "Cancelled",
          cancellationReason,
          cancelledAt: Date.now(),
        });
        await historyOrder.save();

        await orderModel.findByIdAndDelete(orderId);

        io.of("/restaurant")
          .to(order.restaurant.toString())
          .emit("order-removed", { orderId, status: "Cancelled" });
        io.of("/user")
          .to(order.user.toString())
          .emit("order-removed", { orderId, status: "Cancelled" });
      } catch (error) {
        console.log("order error", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.user._id);
    });
  });

  const agentNamespace = io.of("/agent");
  agentNamespace.use(authenticate);
  agentNamespace.on("connection", (socket) => {
    console.log(`"Agent connected:" ${socket?.user?._id}`.bgBlack.white);

    socket.on("join-agent-room", (agentId) => {
      if (agentId !== socket.user._id) {
        console.log("ERROR Agent CONNECTION");
        return socket.emit("error", "Unauthorized room access");
      }
      socket.join(agentId);
    });
    socket.on("update-location", async ({ orderId, lat, lng, stage }) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const agentId = socket.user._id;

        if (!orderId || !lat || !lng || !stage) {
          throw new Error("Missing required fields");
        }

        const tracking = await DeliveryTrackingModel.findOneAndUpdate(
          {
            order: orderId,
            agent: agentId,
            active: true,
          },
          {
            $push: {
              path: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                stage,
                timestamp: new Date(),
              },
            },
          },
          { new: true, session }
        ).populate("order", "status");

        if (!tracking) {
          throw new Error("No active delivery found");
        }

        if (tracking.order.status === "Completed") {
          throw new Error("Order already completed");
        }

        if (stage === "Delivered") {
          tracking.active = false;
          await tracking.save({ session });

          await orderModel.findByIdAndUpdate(
            orderId,
            {
              status: "Completed",
              completedAt: new Date(),
            },
            { session }
          );
        }

        await session.commitTransaction();

        socket.emit("location-update-success", {
          orderId,
          location: tracking.path.slice(-1)[0],
        });
      } catch (error) {
        await session.abortTransaction();
        console.error("Location update error:", error);
        socket.emit("location-update-error", { error: error.message });
      } finally {
        session.endSession();
      }
    });

    socket.on("respond-to-assignment", async ({ orderId, accept }) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const order = await orderModel.findById(orderId).session(session);
        if (!order) throw new Error("Order not found");

        const agentRequest = order.agentRequests.find((req) =>
          req.agent.equals(socket.user._id)
        );
        if (agentRequest) {
          agentRequest.status = accept ? "Accepted" : "Rejected";
        }

        if (accept) {
          order.agent = socket.user._id;
          order.assignedAt = new Date();
        }

        await order.save({ session });

        const agent = await agentModel
          .findById(socket.user._id)
          .session(session);
        if (!agent) throw new Error("Agent not found");

        const assignmentRequest = agent.assignmentRequests.find((req) =>
          req.order.equals(orderId)
        );
        if (assignmentRequest) {
          assignmentRequest.status = accept ? "Accepted" : "Rejected";
          assignmentRequest.respondedAt = new Date();
        }

        if (accept) {
          agent.ordersAssigned.push({
            order: orderId,
            assignedAt: new Date(),
          });
        }

        await agent.save({ session });

        await session.commitTransaction();

        socket.emit("assignment-response-processed", { orderId, accept });
      } catch (err) {
        await session.abortTransaction();
        console.error("Assignment response error:", err);
        socket.emit("assignment-response-error", {
          error: "Failed to process response",
          orderId,
        });
      } finally {
        session.endSession();
      }
    });

    socket.on("disconnect", () => {
      console.log("Agent disconnected:", socket.user._id);
    });
  });
  // Restaurant namespace
  const restaurantNamespace = io.of("/restaurant");
  restaurantNamespace.use(authenticate);
  restaurantNamespace.on("connection", (socket) => {
    console.log(`"Restaurant connected:" ${socket.user._id}`.bgBlue.white);

    socket.on("join-restaurant-room", (restaurantId) => {
      if (restaurantId !== socket.user._id) {
        console.log("ERROR RESTAURANT CONNECTION");
        return socket.emit("error", "Unauthorized restaurant access");
      }
      socket.join(restaurantId);
    });
    socket.on("request-agent-reassignment", async ({ orderId, requestId }) => {
      try {
        console.log("clearing agent request");
        const order = await orderModel.findById(orderId);

        if (!order) {
          return socket.emit("agent-reassignment-error", {
            message: "Order not found",
          });
        }

        order.agentRequests = order.agentRequests.filter(
          (req) => req._id.toString() !== requestId
        );

        await order.save();

        socket.emit("agent-reassignment-done", { clearedRequestId: requestId });
      } catch (error) {
        socket.emit("agent-reassignment-error", { message: error.message });
      }
    });
    socket.on("send-assignment-request", async ({ orderId, agentId }) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // 1. Always push to Order's agentRequests
        const order = await orderModel
          .findByIdAndUpdate(
            orderId,
            {
              $push: {
                agentRequests: {
                  agent: agentId,
                  sentAt: new Date(),
                  status: "Pending",
                },
              },
            },
            { new: true, session }
          )
          .populate(
            "agentRequests.agent",
            "firstName lastName username profilePicture"
          );

        // 2. Check if the agent already has a rejected request for this order
        const agent = await agentModel.findById(agentId).session(session);

        const existingRequest = agent.assignmentRequests.find(
          (req) => req.order.toString() === orderId && req.status === "Rejected"
        );

        if (existingRequest) {
          // 3a. If rejected request exists → update it to pending
          await agentModel.updateOne(
            {
              _id: agentId,
              "assignmentRequests._id": existingRequest._id,
            },
            {
              $set: {
                "assignmentRequests.$.status": "Pending",
                "assignmentRequests.$.sentAt": new Date(),
              },
            },
            { session }
          );
        } else {
          // 3b. Else push new assignment request
          await agentModel.updateOne(
            { _id: agentId },
            {
              $push: {
                assignmentRequests: {
                  order: orderId,
                  status: "Pending",
                  sentAt: new Date(),
                },
              },
              $set: { active: true },
            },
            { session }
          );
        }

        await session.commitTransaction();

        // 4. Get updated populated request
        const populatedAgent = await agentModel
          .findById(agentId)
          .populate({
            path: "assignmentRequests.order",
            populate: [
              {
                path: "restaurant",
                select: "name phone address location logo",
              },
              {
                path: "user",
                select: "name phone address profilePicture location",
              },
              { path: "items.itemId", select: "name price image" },
            ],
          })
          .select("assignmentRequests")
          .lean();

        const request = populatedAgent.assignmentRequests.find(
          (r) => r.order._id.toString() === orderId
        );

        const transformedRequest = {
          _id: request._id,
          status: request.status,
          order: {
            _id: request.order._id,
            totalAmount: request.order.totalAmount,
            deliveryAddress: request.order.deliveryAddress,
            createdAt: request.order.createdAt,
            restaurant: {
              _id: request.order.restaurant._id,
              name: request.order.restaurant.name,
              phone: request.order.restaurant.phone,
              location: request.order.restaurant.location,
              address: request.order.restaurant.address,
              logo: request.order.restaurant.logo || null,
            },
            user: {
              _id: request.order.user._id,
              name: request.order.user.name,
              phone: request.order.user.phone,
              location: request.order.user.location,
              address: request.order.user.address,
              profilePicture: request.order.user.profilePicture || null,
            },
            items: request.order.items.map((item) => ({
              name: item.itemId.name,
              price: item.itemId.price,
              image: item.itemId.image || null,
              quantity: item.quantity,
              total: item.itemId.price * item.quantity,
            })),
          },
        };

        // 5. Notify agent
        io.of("/agent").to(agentId).emit("new-assignment-request", {
          request: transformedRequest,
        });

        socket.emit("assignment-request-sent", {
          agentId,
          agent,
        });
      } catch (err) {
        await session.abortTransaction();
        console.error("Assignment request error:", err);
        socket.emit("assignment-request-error", {
          error: "Failed to send request",
          orderId,
          agentId,
        });
      } finally {
        session.endSession();
      }
    });

    socket.on("accept-order", async ({ orderId, prepTime }) => {
      try {
        const order = await orderModel.findByIdAndUpdate(orderId, {
          status: "Preparing",
          prepTime,
        });
        if (!order || order.restaurant.toString() !== socket.user._id) {
          return socket.emit("order-error", "Invalid order update");
        }
      } catch (error) {
        socket.emit("order-error", error.message);
        console.error("Order acceptance error:", error);
      }
    });

    // handler for status updates
    socket.on("update-order-status", async ({ orderId, status }) => {
      try {
        const order = await orderModel.findById(orderId);
        if (
          !order ||
          order.restaurant.toString() !== socket.user._id.toString()
        ) {
          return socket.emit("order-error", "Invalid order update");
        }
        order.status = status;

        if (["Completed", "Cancelled", "OutForDelivery"].includes(status)) {
          await cleanupAssignmentRequests(orderId, io);
        }
        if (["Completed", "Cancelled"].includes(status)) {
          if (status === "Completed") order.completedAt = Date.now();
          if (status === "Cancelled") order.cancelledAt = Date.now();

          // Move to history
          const historyOrder = new OrderHistoryModel(order.toObject());
          await historyOrder.save();

          await orderModel.findByIdAndDelete(orderId);

          io.of("/restaurant")
            .to(order.restaurant.toString())
            .emit("order-removed", { orderId, status });

          io.of("/user")
            .to(order.user.toString())
            .emit("order-removed", { orderId, status });
          return;
        }

        const updatedOrder = await order.save();
        io.of("/restaurant")
          .to(order.restaurant.toString())
          .emit("order-updated", updatedOrder);
        io.of("/user")
          .to(order.user.toString())
          .emit("order-updated", updatedOrder);
      } catch (error) {
        socket.emit("order-error", error.message);
      }
    });

    socket.on("search-agents", async ({ query }) => {
      try {
        if (!query || query.length < 2) {
          return socket.emit("search-agents-result", { agents: [] });
        }
        const searchRegex = new RegExp(query, "i");
        const agents = await agentModel
          .find({
            active: true,
            $or: [
              { username: searchRegex },
              { "assignmentRequests.status": "Rejected" },
            ],
          })
          .select("firstName lastName username profilePicture")
          .lean();

        socket.emit("search-agents-result", { agents });
      } catch (err) {
        console.error("Search agents error:", err);
        socket.emit("search-agents-error", {
          error: "Failed to search agents",
        });
      }
    });

    socket.on("reject-order", async ({ orderId, cancellationReason }) => {
      try {
        const order = await orderModel.findById(orderId);
        if (
          !order ||
          order.restaurant.toString() !== socket.user._id.toString()
        ) {
          console.log("ERROR", "Invalid order cancellation");
          return socket.emit("order-error", "Invalid order cancellation");
        }
        const historyOrder = new OrderHistoryModel({
          ...order.toObject(),
          status: "Cancelled",
          cancellationReason,
          cancelledAt: Date.now(),
        });
        await historyOrder.save();

        await orderModel.findByIdAndDelete(orderId);

        io.of("/restaurant")
          .to(order.restaurant.toString())
          .emit("order-removed", { orderId, status: "Cancelled" });
        io.of("/user")
          .to(order.user.toString())
          .emit("order-removed", { orderId, status: "Cancelled" });
      } catch (error) {
        console.log("order error", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("Restaurant disconnected:", socket.user._id);
    });
  });

  return io;
};

const cleanupAssignmentRequests = async (orderId, io) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await orderModel.findById(orderId).lean();
    if (!order) return;

    const pendingRequests = order.agentRequests.filter(
      (req) => req.status === "Pending"
    );

    // Update orders
    await orderModel.findByIdAndUpdate(
      orderId,
      { $pull: { agentRequests: { status: "Pending" } } },
      { session }
    );

    // Update agents
    for (const request of pendingRequests) {
      await agentModel.updateOne(
        { _id: request.agent },
        {
          $pull: { assignmentRequests: { order: orderId, status: "Pending" } },
        },
        { session }
      );

      io.of("/agent")
        .to(request.agent.toString())
        .emit("assignment-request-removed", { orderId });
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    console.error("Cleanup error:", err);
  } finally {
    session.endSession();
  }
};

export default socketIoSetup;
