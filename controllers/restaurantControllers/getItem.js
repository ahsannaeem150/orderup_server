import { imageModel } from "../../models/imageModel.js";
import { menuModel } from "../../models/itemModel.js";
import { restaurantModel } from "../../models/restaurantModel.js";

export const getItemController = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;

    const restaurant = await restaurantModel.findById(restaurantId);
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found." });
    }

    if (!restaurant.menu.includes(itemId)) {
      return res.status(404).json({
        success: false,
        message: "Item not found in this restaurant's menu.",
      });
    }

    const item = await menuModel.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    const image = await imageModel.findById(item.image);
    const itemWithImage = {
      ...item.toObject(),
      image: image
        ? {
            contentType: image.contentType,
            data: image.data,
          }
        : null,
    };
    return res.status(200).json({
      success: true,
      message: "Item retrieved successfully",
      item: itemWithImage,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
