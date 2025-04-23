import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema({
    name: {type: String, required: true},
    address: {
        address: {type: String, required: true},
        city: {type: String, required: true},
    },
    phone: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    openingHours: {
        monday: {type: String},
        tuesday: {type: String},
        wednesday: {type: String},
        thursday: {type: String},
        friday: {type: String},
        saturday: {type: String},
        sunday: {type: String},
    },
    location: {
        lat: Number,
        lng: Number,
        updatedAt: Date
    },
    menu: [{type: mongoose.Schema.Types.ObjectId, ref: "menuitems"}],
    rating: {type: Number, min: 0, max: 5, default: 0},
    thumbnail: {type: mongoose.Schema.Types.ObjectId},
    logo: {type: mongoose.Schema.Types.ObjectId},
    deliveryOptions: {
        type: String,
        enum: ["COD", "Debit Card", "Online"],
        default: "COD",
    },
});

export const restaurantModel = mongoose.model("restaurants", RestaurantSchema);
