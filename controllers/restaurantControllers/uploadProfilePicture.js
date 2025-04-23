import { imageModel } from "../../models/imageModel.js";
import { v4 as uuidv4 } from "uuid";
import { restaurantModel } from "../../models/restaurantModel.js";

export const uploadProfileController = async (req, res, next) => {
  console.log("REQUEST URL", req.file);

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file provided." });
  }
  console.log("REQUEST URL", req.url);
  const image = new imageModel({
    name: `${uuidv4()}.${req.file.mimetype.split("/")[1]}`,
    data: req.file.buffer,
    contentType: req.file.mimetype,
  });

  try {
    //GET Restaurant ID
    const restaurantId = req.params.id;
    const imageType = req.params.type;
    //FIND Restaurant
    const restaurant = await restaurantModel.findById(restaurantId);
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found." });
    }

    if (
      restaurant[imageType] &&
      !(
        restaurant[imageType] == "66d228fb279c66d55b69d1ee" ||
        restaurant[imageType] == "66d1b047b588f463a39a8938"
      )
    ) {
      await imageModel.findByIdAndDelete(restaurant[imageType]);
    }

    const savedImage = await image.save();
    restaurant[imageType] = savedImage._id;
    const savedRestaurant = await restaurant.save();

    //CHANGE Restaurant PROFILE
    restaurant[imageType] = image;
    console.log(restaurant);
    await restaurant.save();

    return res.status(201).json({
      success: true,
      message: "Image uploaded and restaurant updated successfully.",
      restaurant: savedRestaurant,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
