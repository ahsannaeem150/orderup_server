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
    ordersAssigned: {
      type: [
        {
          order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "orders",
          },
          assignedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },

    ordersHistory: {
      type: [
        {
          order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "orders",
          },
          completedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    assignmentRequests: {
      type: [
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
      default: [],
    },
  },

  { timestamps: true }
);

export const agentModel = mongoose.model("agents", agentSchema);
