import { imageModel } from "../../models/imageModel.js";
import { userModel } from "../../models/userModel.js";

export const getProfilePictureController = async (req, res) => {
  const imageId = req.query.profilePicture;
  console.log(imageId);

  const image = await imageModel.findOne({ _id: imageId });
  if (!image) {
    return res
      .status(404)
      .json({ success: false, message: "Image not found." });
  }
  console.log("hiii");

  res.set("Content-Type", image.contentType);
  console.log("imagesent");
  res.send(image.data);
};
