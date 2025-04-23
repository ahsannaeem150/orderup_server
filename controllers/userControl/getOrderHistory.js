import { OrderHistoryModel } from "../../models/orderHistoryModel.js";

export const getOrderHistoryController = async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch orders for the user, sorted by completed date
    const orders = await OrderHistoryModel.find({ userId })
      .sort({ completedAt: -1 }) // Sort by completedAt in descending order
      .populate("restaurantId", "name logo phone") // Populate restaurant details
      .populate("items.itemId", "name price") // Populate item details
      .exec();

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ error: "Failed to fetch order history" });
  }
};
