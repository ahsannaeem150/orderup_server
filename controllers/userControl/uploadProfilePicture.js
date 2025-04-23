import { userModel } from "../../models/userModel.js";
import { imageModel } from "../../models/imageModel.js";
import { v4 as uuidv4 } from "uuid";

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
    const userId = req.params.id;
    //FIND USER
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    console.log(user);

    // Delete the previous image if it exists
    if (
      user.profilePicture &&
      user.profilePicture != "66d1b047b588f463a39a8938"
    ) {
      await imageModel.findByIdAndDelete(user.profilePicture);
    }

    const savedImage = await image.save();
    user.profilePicture = savedImage._id;
    const savedUser = await user.save();

    //CHANGE USER PROFILE
    user.profileImage = image;
    console.log(user);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Image uploaded and user updated successfully.",
      user: savedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
