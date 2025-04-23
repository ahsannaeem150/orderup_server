import { userModel } from "../../models/userModel.js";
import { agentModel } from "../../models/agentModel.js";

export const updateProfileController = async (req, res) => {
  try {
    const agentId = req.params.id;
    const agent = await agentModel.findById(agentId);

    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "agent not found." });
    }

    if (req.body.location) {
      agent.location = {
        lat: req.body.location.lat,
        lng: req.body.location.lng,
        updatedAt: new Date(),
      };
    }

    agent.username = req.body.username;
    agent.phone = req.body.phone;
    agent.address.address = req.body.address.address;
    agent.address.city = req.body.address.city;

    await agent.save();
    console.log(agent);
    return res.status(201).json({
      success: true,
      message: "agent updated successfully.",
      agent: agent,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
