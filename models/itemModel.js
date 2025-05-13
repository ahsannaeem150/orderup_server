import mongoose from "mongoose";
import { reviewModel } from "./reviewModel.js";

const MenuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 200,
    },
    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailySales: [
      {
        date: Date,
        quantity: Number,
        revenue: Number,
      },
    ],
    lastSoldDate: Date,
    popularityScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    discountStart: Date,
    discountEnd: Date,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxStock: {
      type: Number,
      min: 0,
    },
    minStock: {
      type: Number,
      min: 0,
    },

    category: {
      type: String,
      enum: [
        "Food",
        "Fast Food",
        "Desi",
        "Chinese & Asian",
        "Healthy & Diet Food",
        "Bakery & Desserts",
        "Beverages",
        "Street Food",
      ],
      default: "Desi",
    },
    tags: [
      {
        type: String,
      },
    ],

    supplier: {
      name: String,
      contact: String,
    },
    expiryDate: Date,
    lastRestocked: Date,

    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      index: true,
    },

    status: {
      type: String,
      enum: ["available", "out-of-stock", "discontinued"],
      default: "available",
    },
    preparationTime: {
      type: Number,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["pieces", "kg", "liters", "packets"],
      default: "pieces",
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "itemreviews",
      },
    ],
    createdAt: {
      type: Date,
    },
    updatedAt: Date,
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

MenuItemSchema.virtual("stockPercentage").get(function () {
  return Math.round((this.stock / this.maxStock) * 100);
});

MenuItemSchema.virtual("lowStockAlert").get(function () {
  return this.stock <= this.minStock;
});

MenuItemSchema.virtual("profitMargin").get(function () {
  return ((this.price - this.costPrice) / this.price) * 100;
});

MenuItemSchema.index({ totalSold: -1 });
MenuItemSchema.index({ popularityScore: -1 });
MenuItemSchema.index({ status: 1 });
MenuItemSchema.index({ discountEnd: 1 });
MenuItemSchema.index({ restaurant: 1, category: 1 });
MenuItemSchema.index({ expiryDate: 1 });

MenuItemSchema.methods.calculatePopularityScore = async function () {
  const Review = mongoose.model("itemreviews");
  const reviews = await Review.find({ _id: { $in: this.reviews } });

  const score = reviews.reduce((score, review) => {
    return score + review.calculatedImpact;
  }, this.totalSold);

  if (score < 0) {
    return 0;
  } else {
    return score;
  }
};

// Update pre-save hook to calculate popularity
MenuItemSchema.pre("save", async function (next) {
  if (this.isModified("totalSold") || this.isModified("reviews")) {
    this.popularityScore = await this.calculatePopularityScore();
  }
  this.updatedAt = new Date();
  next();
});

export const menuModel = mongoose.model("menuitems", MenuItemSchema);
