import jwt from "jsonwebtoken";
import { comparePassword } from "../../helpers/authHelper.js";
import { userModel } from "../../models/userModel.js";

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
    //find User
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "User is not registered with this email",
      });
    }
    //match Password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(500).send({
        success: false,
        message: "Invalid username or password",
      });
    }
    //generate token

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "100d",
    });
    //undefined password
    user.password = undefined;
    res.status(200).send({
      success: true,
      message: "Login successfully",
      token,
      user,
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
