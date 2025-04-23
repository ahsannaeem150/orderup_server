import { restaurantModel } from "../../models/restaurantModel.js";

export const getBatchRestaurants = async (req, res) => {
  try {
    const restaurants = await restaurantModel
      .find({
        _id: { $in: req.body.ids },
      })
      .populate("menu", "_id")
      .select("_id name logo thumbnail address phone openingHours");

    return res.status(200).json(restaurants);
  } catch (error) {
    console.error("Batch fetch error:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
