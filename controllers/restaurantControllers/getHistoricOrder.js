import {OrderHistoryModel} from "../../models/orderHistoryModel.js";

export const getHistoricOrderController = async (req, res) => {
    try {
        const order = await OrderHistoryModel.findOne({
            _id: req.params.id,
        }).populate("user", "name email address location phone profilePicture");

        if (!order) {
            return res.status(404).json({error: "Order not found"});
        }

        res.json(order);
    } catch (error) {
        console.error("Error fetching historical order:", error);
        res.status(500).json({error: "Failed to fetch order"});
    }
};
