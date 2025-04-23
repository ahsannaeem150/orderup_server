import mongoose from "mongoose";

const OrderHistorySchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "restaurants",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        items: [
            {
                itemId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "menuitems",
                    required: true,
                },
                name: {type: String, required: true},
                price: {type: Number, required: true},
                quantity: {type: Number, required: true},
            },
        ],
        totalAmount: {type: Number, required: true},
        orderDate: {type: Date, default: Date.now},
        deliveryAddress: {type: String, required: true},
        updatedAt: {type: Date, default: Date.now},
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            default: () => Math.floor(100000 + Math.random() * 900000).toString(),
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        estimatedDeliveryTime: {
            type: String,
            default: "30-45 mins",
        },
        agent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "agents"
        },
        deliveryPath: [{
            lat: Number,
            lng: Number,
            timestamp: { type: Date, default: Date.now }
        }],
        acceptedAt: Date,
        completedAt: Date,
        cancelledAt: Date,
        prepTime: {
            type: String,
            default: "20 minutes",
        },
        paymentMethod: {
            type: String,
            enum: ["Cash", "Card", "Online"],
            default: "Cash",
            required: true,
        },
        orderType: {type: String, enum: ["Delivery", "Pickup"], required: true, default: "Delivery"},
        status: {
            type: String,
            enum: ["Pending", "Preparing", "Ready", "Completed", "Cancelled"],
            default: "Pending",
        },
        statusTimestamps: {
            Pending: {type: Date},
            Preparing: {type: Date},
            OutForDelivery: {type: Date},
            Completed: {type: Date},
            Cancelled: {type: Date}
        },
        cancellationReason: {type: String, default: ""},
        notes: {type: String, default: ""},
    },
    {timestamps: true}
);

export const OrderHistoryModel = mongoose.model(
    "orderhistories",
    OrderHistorySchema
);
