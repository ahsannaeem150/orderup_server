import {orderModel} from "../../models/orderModel.js";

export const getBatchOrdersController = async (req, res) => {
    try {
        const {ids} = req.body;

        if (!Array.isArray(ids)) {
            return res.status(400).json({error: "Invalid request format"});
        }

        const orders = await orderModel
            .find({_id: {$in: ids}})
            .populate("restaurant", "name logo address")
            .populate("user", "name email")
            .populate("items.itemId", "name price");

        res.json(orders);
    } catch (error) {
        console.error("Error fetching batch orders:", error);
        res.status(500).json({error: "Failed to fetch orders"});
    }
};
