// Image schema in MongoDB.
import mongoose from "mongoose";
const imageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
});

export const restaurantImageModel = mongoose.model(
  "restaurantImages",
  imageSchema
);
