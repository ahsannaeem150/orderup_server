import { imageModel } from "../../models/imageModel.js";
import { restaurantModel } from "../../models/restaurantModel.js";

export const getRestaurantsController = async (req, res) => {
  try {
    const restaurants = await restaurantModel
      .find()
      .populate("menu", "_id name price image")
      .select("_id name address logo thumbnail phone");

    return res.status(200).json({ restaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
