import {OrderHistoryModel} from "../../models/orderHistoryModel.js";

export const getHistoricOrdersController = async (req, res) => {
    try {
        const orders = await OrderHistoryModel
            .find({restaurant: req.params.restaurantId})
            .populate("user", "name email address location phone profilePicture")
            .sort("-createdAt");

        res.json(orders);
    } catch (error) {
        console.error("Error fetching historical orders:", error);
        res.status(500).json({error: "Failed to fetch order history"});
    }
};
