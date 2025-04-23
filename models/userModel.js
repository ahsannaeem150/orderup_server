import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
        firstName: {type: String},
        lastName: {type: String},
        name: {
            type: String,
            required: [true, "Please add name"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "please add email"],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Please add password"],
            trim: true,
            min: 6,
            max: 14,
        },
        address: {
            address: {type: String},
            city: {type: String},
        },
        location: {
            lat: Number,
            lng: Number,
            updatedAt: Date
        },
        orderHistory: [mongoose.Schema.Types.ObjectId],
        phone: {type: String},
        profilePicture: {
            type: mongoose.Schema.Types.ObjectId,
        },
        role: {
            type: String,
            enum: ["Customer", "Admin", "Restaurant Owner"],
            default: "Customer",
        },
    },
    {timestamps: true}
);

export const userModel = mongoose.model("users", userSchema);
