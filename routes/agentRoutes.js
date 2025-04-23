import express from "express";
import multer from "multer";

import { loginController } from "../controllers/agentControllers/loginAgent.js";
import { registerController } from "../controllers/agentControllers/registerAgent.js";
import { uploadProfileController } from "../controllers/agentControllers/uploadProfilePicture.js";
import { updateProfileController } from "../controllers/agentControllers/updateProfile.js";
import { getRequestsController } from "../controllers/agentControllers/getRequests.js";

//router object
const router = express.Router();

//REGISTER || POST
router.post("/auth/agent/register", registerController);
//REGISTER || POST
router.post("/auth/agent/login", loginController);

const storage = multer.memoryStorage();
const upload = multer({ storage });
//UPLOAD PICTURE
router.put(
  "/agent/:id/profile/image",
  upload.single("image"),
  uploadProfileController
);
//
router.put("/agent/:id/profile/update", updateProfileController);
router.get("/agent/:id/requests", getRequestsController);

export default router;
