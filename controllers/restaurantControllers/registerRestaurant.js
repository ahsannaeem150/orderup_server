import { hashPassword } from "../../helpers/authHelper.js";
import { restaurantModel } from "../../models/restaurantModel.js";

//REGISTER RESTAURANT
export const registerController = async (req, res) => {
  try {
    const { name, email, password, logo, thumbnail, phone, city, address } =
      req.body;
    console.log("REQ BODY", req.body);

    //validation
    if (!name) {
      return res.status(400).send({
        success: false,
        message: "name is required",
      });
    }
    if (!email) {
      return res.status(400).send({
        success: false,
        message: "email is required",
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).send({
        success: false,
        message: "password is required and 6 charaters long",
      });
    }
    if (!phone) {
      return res.status(400).send({
        success: false,
        message: "phone is required",
      });
    }
    if (!city) {
      return res.status(400).send({
        success: false,
        message: "city is required",
      });
    }
    if (!address) {
      return res.status(400).send({
        success: false,
        message: "address is required",
      });
    }
    if (!logo) {
      logo = "66d1b047b588f463a39a8938";
    }
    if (!thumbnail) {
      thumbnail = "66d22427146a2944b59386ec";
    }

    //existing user check
    const existingUser = await restaurantModel.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "Restaurant already registered with this email",
      });
    }

    const hashedPassword = await hashPassword(password);

    const restaurant = await restaurantModel({
      name,
      email,
      logo,
      thumbnail,
      phone,
      address: {
        city,
        address,
      },
      password: hashedPassword,
    }).save();

    res.status(201).send({
      success: true,
      message: "Restaurant created successfully",
      restaurant,
    });
  } catch (error) {
    console.log(`Error in register ${error}`.bgBlue.black);
    return res.status(500).send({
      success: false,
      message: "Error in register api",
      error,
    });
  }
};
