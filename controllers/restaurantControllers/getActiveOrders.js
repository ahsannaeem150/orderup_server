import {orderModel} from "../../models/orderModel.js";

export const getActiveOrdersController = async (req, res) => {
    try {
        const restaurant = req.params.restaurantId;
        const activeOrders = await orderModel
            .find({
                restaurant,
                status: {$nin: ["Completed", "Cancelled"]},
            })
            .select(
                "orderNumber createdAt estimatedDeliveryTime items totalAmount status user"
            )
            .populate("user", "name email address location phone profilePicture")
            .sort({createdAt: -1})
            .lean();

        if (!activeOrders.length) return res.status(200).json([]);

        res.status(200).json(activeOrders);
    } catch (error) {
        console.error("Error fetching active orders:", error);
        res.status(500).json({error: "Failed to fetch active orders"});
    }
};
