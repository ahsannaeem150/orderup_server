import { menuModel } from "../../models/itemModel.js";
import { reviewModel } from "../../models/reviewModel.js";

export const getReviewsController = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await menuModel.findById(itemId).lean();
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const reviews = await reviewModel
      .find({ itemId })
      .populate({
        path: "userId",
        select: "name profilePicture",
        populate: {
          path: "profilePicture",
          select: "_id",
        },
      })
      .lean();
    const formattedReviews = reviews.map((review) => ({
      ...review,
      itemId: review.itemId,
    }));
    return res.status(200).json({
      success: true,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
