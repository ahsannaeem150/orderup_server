import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    username: {
      type: String,
      unique: true,
    },
    email: { type: String, required: true, unique: true, trim: true },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    address: {
      address: { type: String },
      city: { type: String },
    },
    phone: { type: String },
    profilePicture: { type: mongoose.Schema.Types.ObjectId },
    location: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
    active: { type: Boolean, default: false },
    ordersAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "orders" }],
    assignmentRequests: [
      {
        order: { type: mongoose.Schema.Types.ObjectId, ref: "orders" },
        status: {
          type: String,
          enum: ["Pending", "Accepted", "Rejected"],
          default: "Pending",
        },
        sentAt: Date,
        respondedAt: Date,
      },
    ],
  },

  { timestamps: true }
);

export const agentModel = mongoose.model("agents", agentSchema);
