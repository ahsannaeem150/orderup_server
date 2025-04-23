import mongoose from "mongoose";
import { menuModel } from "./itemModel.js";

const reviewSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "menuitems",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.virtual("calculatedImpact").get(function () {
  switch (this.rating) {
    case 5:
      return 5;
    case 4:
      return 4;
    case 2:
      return -4;
    case 1:
      return -5;
    default:
      return 0;
  }
});

reviewSchema.index({ itemId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });
// Middleware to handle score updates
reviewSchema.post("save", async function (doc) {
  const MenuItem = mongoose.model("menuitems");
  const item = await MenuItem.findById(doc.itemId);

  if (item) {
    if (!item.reviews.includes(doc._id)) {
      item.reviews.push(doc._id);
    }

    item.popularityScore = await item.calculatePopularityScore();
    await item.save();
  }
});

reviewSchema.post("remove", async function (doc) {
  const MenuItem = mongoose.model("menuitems");
  const item = await MenuItem.findById(doc.itemId);

  if (item) {
    item.reviews.pull(doc._id);
    item.popularityScore = await item.calculatePopularityScore();
    await item.save();
  }
});

export const reviewModel = mongoose.model("itemreviews", reviewSchema);
