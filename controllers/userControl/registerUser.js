import { hashPassword } from "../../helpers/authHelper.js";
import { userModel } from "../../models/userModel.js";

//REGISTER USER
export const registerController = async (req, res) => {
  try {
    const { name, email, password, profilePicture } = req.body;
    console.log("name", name);
    console.log(req.body);

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
    if (!profilePicture) {
      profilePicture = "66d1b047b588f463a39a8938";
    }

    //existing user check
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "User already registered with this email",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await userModel({
      name,
      email,
      password: hashedPassword,
      profilePicture,
    }).save();

    res.status(201).send({
      success: true,
      message: "User created successfully",
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
