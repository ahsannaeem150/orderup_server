import {OrderHistoryModel} from "../../models/orderHistoryModel.js";

export const getHistoricOrdersController = async (req, res) => {
    try {
        const orders = await OrderHistoryModel
            .find({user: req.params.userId})
            .populate("restaurant", "name logo address")
            .sort("-createdAt");

        res.json(orders);
    } catch (error) {
        console.error("Error fetching historical orders:", error);
        res.status(500).json({error: "Failed to fetch order history"});
    }
};
