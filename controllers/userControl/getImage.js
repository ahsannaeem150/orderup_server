import { imageModel } from "../../models/imageModel.js";

export const getImage = async (req, res) => {
  try {
    const image = await imageModel.findById(req.params.imageId);
    if (!image) return res.status(404).send("Image not found");

    res.set("Content-Type", image.contentType);
    res.send(image.data);
  } catch (error) {
    res.status(500).send("Server error");
  }
};
