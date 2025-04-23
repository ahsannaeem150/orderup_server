import { imageModel } from "../../models/imageModel.js";
import { menuModel } from "../../models/itemModel.js";
import { restaurantModel } from "../../models/restaurantModel.js";

export const deleteItemController = async (req, res) => {
  try {
    console.log("HELLOOO");
    const { restaurantId, itemId } = req.params;

    const restaurant = await restaurantModel.findById(restaurantId);
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found." });
    }

    // Remove item from the restaurant's
    restaurant.menu = restaurant.menu.filter((id) => id.toString() !== itemId);
    await restaurant.save();

    // Find the item to delete
    const item = await menuModel.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    // Find and delete the associated image
    if (item.image) {
      const image = await imageModel.findById(item.image);
      if (image) {
        await imageModel.findByIdAndDelete(item.image);
      }
    }

    // Delete the item from the menuModel
    await menuModel.findByIdAndDelete(itemId);

    console.log("Item deleted succesfully");
    return res.status(200).json({
      success: true,
      message: "Item and associated image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
