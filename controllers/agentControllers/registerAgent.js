import { hashPassword } from "../../helpers/authHelper.js";
import { agentModel } from "../../models/agentModel.js";

//REGISTER AGENT
export const registerController = async (req, res) => {
  try {
    const { username, email, password, profilePicture } = req.body;

    //validation
    if (!username) {
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
    //existing agent check
    const existingAgent = await agentModel.findOne({ email });
    if (existingAgent) {
      return res.status(200).send({
        success: false,
        message: "Agent already registered with this email",
      });
    }

    const hashedPassword = await hashPassword(password);

    const agent = await agentModel({
      username,
      email,
      password: hashedPassword,
      profilePicture,
    }).save();

    res.status(201).send({
      success: true,
      message: "Agent created successfully",
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
