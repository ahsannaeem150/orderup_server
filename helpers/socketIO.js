import { Server } from "socket.io";
import { orderModel } from "../models/orderModel.js";
import jwt from "jsonwebtoken";
import { OrderHistoryModel } from "../models/orderHistoryModel.js";
import { agentModel } from "../models/agentModel.js";
import mongoose from "mongoose";

const setupChangeStream = async (io) => {
  try {
    const changeStream = orderModel.watch([], {
      fullDocument: "updateLookup",
      readPreference: "primary",
    });

    changeStream.on("change", async (change) => {
      try {
        console.log(change.operationType);
        let order = [];
        if (["insert", "update"].includes(change.operationType)) {
          order = await orderModel
            .findById(change.documentKey._id)
            .populate("user", "_id name phone profilePicture")
            .populate("restaurant", "_id name address logo")
            .lean();
        }
        const restaurantId =
          order?.restaurant?._id?.toString() || order?.restaurant?.toString();
        const userId = order?.user?._id?.toString();

        console.log(change.documentKey._id);
        switch (change.operationType) {
          case "insert":
            io.of("/restaurant").to(restaurantId).emit("order-created", order);
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

const socketIoSetup = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  setupChangeStream(io);

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
      console.log("User disconnected:", socket.user.id);
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

    socket.on("respond-to-assignment", async ({ orderId, accept }) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update Order
        const order = await orderModel.findByIdAndUpdate(
          orderId,
          {
            $set: {
              "agentRequests.$[elem].status": accept ? "Accepted" : "Rejected",
              ...(accept && { agent: socket.user.id, assignedAt: new Date() }),
            },
          },
          {
            arrayFilters: [{ "elem.agent": socket.user.id }],
            new: true,
            session,
          }
        );

        // Update Agent
        const agent = await agentModel.findByIdAndUpdate(
          socket.user.id,
          {
            $set: {
              "assignmentRequests.$[elem].status": accept
                ? "Accepted"
                : "Rejected",
              "assignmentRequests.$[elem].respondedAt": new Date(),
            },
          },
          {
            arrayFilters: [{ "elem.order": orderId }],
            new: true,
            session,
          }
        );

        await session.commitTransaction();

        // Notify Restaurant
        io.of("/restaurant")
          .to(order.restaurant.toString())
          .emit("order-updated", order);

        // Notify Agent
        socket.emit("assignment-response-processed", {
          order,
          request: agent.assignmentRequests.find(
            (r) => r.order.toString() === orderId
          ),
        });
      } catch (err) {
        await session.abortTransaction();
        console.error("Assignment response error:", err);
        socket.emit("assignment-response-error", "Failed to process response");
      } finally {
        session.endSession();
      }
    });

    socket.on("disconnect", () => {
      console.log("Agent disconnected:", socket.user.id);
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

    socket.on("send-assignment-request", async ({ orderId, agentId }) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update Order
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
          .populate("agentRequests.agent");

        // Update Agent
        const agent = await agentModel.findByIdAndUpdate(
          agentId,
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
          { new: true, session }
        );

        await session.commitTransaction();

        // Notify Agent
        io.of("/agent")
          .to(agentId)
          .emit("new-assignment-request", {
            order,
            request: agent.assignmentRequests.find(
              (r) => r.order.toString() === orderId
            ),
          });

        // Notify Restaurant
        socket.emit("assignment-request-sent", {
          orderId,
          agentId,
          request: order.agentRequests.find(
            (r) => r.agent.toString() === agentId
          ),
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
            $or: [{ username: searchRegex }],
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
      console.log("Restaurant disconnected:", socket.user.id);
    });
  });

  return io;
};

export default socketIoSetup;
