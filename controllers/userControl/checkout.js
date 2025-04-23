import {orderModel} from "../../models/orderModel.js";

export const checkoutController = async (req, res) => {
    try {
        const {
            userId,
            name,
            phone,
            city,
            address,
            cart,
            estimatedDeliveryTime,
            notes,
        } = req.body;
        if (
            !userId ||
            !name ||
            !phone ||
            !city ||
            !address ||
            !cart ||
            !estimatedDeliveryTime
        ) {
            return res.status(400).json({error: "Missing required fields"});
        }
        const orders = await Promise.all(
            cart.map(async (restaurantCart) => {
                const {restaurant, order} = restaurantCart;

                // Calculate total amount for the order
                const totalAmount = order.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                );

                // Create a new order
                const newOrder = new orderModel({
                    user: userId,
                    restaurant: restaurant._id,
                    items: order.map((item) => ({
                        itemId: item._id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                    })),
                    totalAmount,
                    deliveryAddress: `${address}, ${city}`,
                    estimatedDeliveryTime,
                    notes,
                });

                await newOrder.save();

                return newOrder;
            })
        );
        return res.status(201).json({
            message: "Index placed successfully",
        });
    } catch (error) {
        console.error("Error during checkout:", error);
        res.status(500).json({error: "Internal server error"});
    }
};
