import { restaurantModel } from "../../models/restaurantModel.js";

export const updateProfileController = async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await restaurantModel.findById(restaurantId);

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "restaurant not found." });
    }

    if (req.body.location) {
      restaurant.location = {
        lat: req.body.location.lat,
        lng: req.body.location.lng,
        updatedAt: new Date(),
      };
    }

    restaurant.name = req.body.username;
    restaurant.phone = req.body.phone;
    restaurant.address.address = req.body.address.address;
    restaurant.address.city = req.body.address.city;

    await restaurant.save();
    console.log(restaurant);
    return res.status(201).json({
      success: true,
      message: "restaurant updated successfully.",
      restaurant: restaurant,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
