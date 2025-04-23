import jwt from "jsonwebtoken";
import { comparePassword } from "../../helpers/authHelper.js";
import { restaurantModel } from "../../models/restaurantModel.js";

//LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Please provide email or password",
      });
    }
    //find Restaurant
    const restaurant = await restaurantModel.findOne({ email });
    if (!restaurant) {
      return res.status(200).send({
        success: false,
        message: "Restaurant is not registered with this email",
      });
    }
    //match Password
    const match = await comparePassword(password, restaurant.password);
    if (!match) {
      return res.status(500).send({
        success: false,
        message: "Invalid username or password",
      });
    }
    console.log("Log");

    //generate token
    const token = jwt.sign({ _id: restaurant._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    //undefined password
    restaurant.password = undefined;
    res.status(200).send({
      success: true,
      message: "Login successfully",
      token,
      restaurant,
    });
  } catch (error) {
    console.log(`Error in login ${error}`.bgBlue.black);
    return res.status(500).send({
      success: false,
      message: "Error in login api",
      error,
    });
  }
};
