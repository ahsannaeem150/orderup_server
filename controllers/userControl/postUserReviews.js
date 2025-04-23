import { menuModel } from "../../models/itemModel.js";
import { reviewModel } from "../../models/reviewModel.js";

//REGISTER USER
export const postUserReviewController = async (req, res) => {
  try {
    const { itemId, userId } = req.params;
    const { rating, comment } = req.body;

    const review = await reviewModel.create({
      itemId,
      userId,
      rating,
      comment,
    });

    await menuModel.findByIdAndUpdate(itemId, {
      $push: { reviews: review._id },
    });

    const populatedReview = await reviewModel
      .findById(review._id)
      .populate("userId", "name profilePicture");

    res.status(201).json({
      success: true,
      review: {
        ...populatedReview.toObject(),
        userId: {
          _id: populatedReview.userId._id,
          name: populatedReview.userId.name,
          profilePicture: populatedReview.userId.profilePicture,
        },
      },
    });
  } catch (error) {
    console.error("Review error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
