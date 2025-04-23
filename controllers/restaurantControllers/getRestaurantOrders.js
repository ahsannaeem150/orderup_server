import { orderModel } from "../../models/orderModel.js";

export const getRestaurantOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ restaurant: req.params.restaurantId })
      .populate({
        path: "user",
        select: "name phone address profilePicture",
      })
      .sort({ orderDate: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};
