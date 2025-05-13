import { orderModel } from "../../models/orderModel.js";

export const getSingleOrderController = async (req, res) => {
  try {
    const order = await orderModel
      .findById(req.params.orderId)
      .populate("restaurant", "name logo address")
      .populate("user", "name email")
      .populate("items.itemId", "name price");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};
