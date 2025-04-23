import { imageModel } from "../../models/imageModel.js";
import { v4 as uuidv4 } from "uuid";
import {agentModel} from "../../models/agentModel.js";

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
    console.log("Create image");
    //GET USER ID
    const agentId = req.params.id;
    //FIND USER
    const agent = await agentModel.findById(agentId);
    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Delete the previous image if it exists
    if (
      agent.profilePicture &&
      agent.profilePicture != "66d1b047b588f463a39a8938"
    ) {
      await imageModel.findByIdAndDelete(agent.profilePicture);
    }

    const savedImage = await image.save();
    agent.profilePicture = savedImage._id;
    const savedAgent = await agent.save();

    //CHANGE USER PROFILE
    agent.profileImage = image;
    await agent.save();

    return res.status(201).json({
      success: true,
      message: "Image uploaded and user updated successfully.",
      agent: savedAgent,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
