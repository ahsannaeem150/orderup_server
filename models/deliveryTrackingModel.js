import mongoose from "mongoose";

const DeliveryTrackingSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
      required: true,
      unique: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "agents",
      required: true,
    },
    path: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
        stage: {
          type: String,
          enum: ["EnRoute", "PickedUp", "Delivered"],
          required: true,
        },
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

DeliveryTrackingSchema.index({ order: 1 });
DeliveryTrackingSchema.index({ agent: 1 });
DeliveryTrackingSchema.index({ "path.timestamp": 1 });

export const DeliveryTrackingModel = mongoose.model(
  "DeliveryTracking",
  DeliveryTrackingSchema
);
