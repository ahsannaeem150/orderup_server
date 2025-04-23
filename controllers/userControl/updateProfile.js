import { userModel } from "../../models/userModel.js";

export const updateProfileController = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found." });
    }

    if (req.body.location) {
      user.location = {
        lat: req.body.location.lat,
        lng: req.body.location.lng,
        updatedAt: new Date(),
      };
    }

    user.name = req.body.username;
    user.phone = req.body.phone;
    user.address.address = req.body.address.address;
    user.address.city = req.body.address.city;

    await user.save();
    console.log(user);
    return res.status(201).json({
      success: true,
      message: "user updated successfully.",
      user: user,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
