import jwt from "jsonwebtoken";
import { comparePassword } from "../../helpers/authHelper.js";
import { agentModel } from "../../models/agentModel.js";

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
    //find Agent
    const agent = await agentModel.findOne({ email });
    if (!agent) {
      return res.status(401).send({
        success: false,
        message: "agent is not registered with this email",
      });
    }
    //match Password
    const match = await comparePassword(password, agent.password);
    if (!match) {
      return res.status(500).send({
        success: false,
        message: "Invalid username or password",
      });
    }
    //generate token

    const token = jwt.sign({ _id: agent._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    //undefined password
    agent.password = undefined;
    res.status(200).send({
      success: true,
      message: "Login successfully",
      token,
      agent,
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
