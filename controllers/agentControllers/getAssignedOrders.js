import { agentModel } from "../../models/agentModel.js";

export const getAssignedOrdersController = async (req, res) => {
  try {
    const agentId = req.params.id;

    const agent = await agentModel
      .findById(agentId)
      .populate({
        path: "ordersAssigned.order",
        match: { status: { $ne: "Completed" } },
        populate: [
          {
            path: "restaurant",
            select: "name phone address location logo",
          },
          {
            path: "items.itemId",
            select: "name price image",
          },
          {
            path: "user",
            select: "name phone address profilePicture location",
          },
        ],
      })
      .select("ordersAssigned")
      .lean();

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const orders = (agent.ordersAssigned || []).map((assignment) => {
      const order = assignment.order;
      return {
        _id: order._id,
        status: "Accepted",
        order: {
          _id: order._id,
          totalAmount: order.totalAmount,
          deliveryAddress: order.deliveryAddress,
          createdAt: order.createdAt,
          restaurant: {
            _id: order.restaurant._id,
            name: order.restaurant.name,
            phone: order.restaurant.phone,
            location: order.restaurant.location,
            address: order.restaurant.address,
            logo: order.restaurant.logo || null,
          },
          user: {
            _id: order.user._id,
            name: order.user.name,
            phone: order.user.phone,
            location: order.user.location,
            address: order.user.address,
            profilePicture: order.user.profilePicture || null,
          },
          items: order.items.map((item) => ({
            name: item.itemId.name,
            price: item.itemId.price,
            image: item.itemId.image || null,
            quantity: item.quantity,
            total: item.itemId.price * item.quantity,
          })),
        },
      };
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching assigned orders:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
