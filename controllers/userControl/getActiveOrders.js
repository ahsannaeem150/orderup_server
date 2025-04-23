import { orderModel } from "../../models/orderModel.js";

export const getActiveOrdersController = async (req, res) => {
  try {
    const user = req.params.userId;
    const activeOrders = await orderModel
      .find({
        user,
        status: { $nin: ["Completed", "Cancelled"] },
      })
      .select(
        "orderNumber createdAt estimatedDeliveryTime items totalAmount status restaurant"
      )
      .populate("restaurant", "name logo address")
      .sort({ createdAt: -1 })
      .lean();

    if (!activeOrders.length) return res.status(200).json([]);

    res.status(200).json(activeOrders);
  } catch (error) {
    console.error("Error fetching active orders:", error);
    res.status(500).json({ error: "Failed to fetch active orders" });
  }
};
