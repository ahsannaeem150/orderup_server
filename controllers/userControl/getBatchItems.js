import mongoose from "mongoose";
import { menuModel } from "../../models/itemModel.js";

export const getBatchItems = async (req, res) => {
  try {
    const validIds = req.body.itemIds.filter((obj) =>
      mongoose.Types.ObjectId.isValid(obj._id)
    );

    res.set("Cache-Control", "public, max-age=3600");

    const items = await menuModel
      .find(
        { _id: { $in: validIds } },
        "_id name description price image category"
      )
      .lean();
    return res.status(200).json(items);
  } catch (error) {
    console.error("Batch items error:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};
