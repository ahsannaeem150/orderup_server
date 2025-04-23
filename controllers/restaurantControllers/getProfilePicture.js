import { imageModel } from "../../models/imageModel.js";

export const getProfilePictureController = async (req, res) => {
  const type = req.params.type;
  const imageId = req.query[type];

  const image = await imageModel.findOne({ _id: imageId });
  if (!image) {
    return res
      .status(404)
      .json({ success: false, message: "Image not found." });
  }
  res.set("Content-Type", image.contentType);
  res.send(image.data);
};
