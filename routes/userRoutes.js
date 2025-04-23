import express from "express";
import multer from "multer";
import { loginController } from "../controllers/userControl/loginUser.js";
import { registerController } from "../controllers/userControl/registerUser.js";
import { uploadProfileController } from "../controllers/userControl/uploadProfilePicture.js";
import { getProfilePictureController } from "../controllers/userControl/getProfilePicture.js";
import { updateProfileController } from "../controllers/userControl/updateProfile.js";
import { getRestaurantsController } from "../controllers/userControl/getRestaurants.js";
import { postUserReviewController } from "../controllers/userControl/postUserReviews.js";
import { getReviewsController } from "../controllers/userControl/getUserReviews.js";
import { checkoutController } from "../controllers/userControl/checkout.js";
import { getActiveOrdersController } from "../controllers/userControl/getActiveOrders.js";
import { getRecommendationsController } from "../controllers/userControl/getRecommendations.js";
import { getBatchRestaurants } from "../controllers/userControl/getBatchRestaurant.js";
import { getImage } from "../controllers/userControl/getImage.js";
import { getBatchItems } from "../controllers/userControl/getBatchItems.js";
import { getItemsController } from "../controllers/userControl/getItemsController.js";
import { getItemController } from "../controllers/userControl/getItemController.js";
import { getHistoricOrdersController } from "../controllers/userControl/getHistoricOrders.js";
import { getHistoricOrderController } from "../controllers/userControl/getHistoricOrder.js";
import { getSingleOrderController } from "../controllers/userControl/getSingleOrder.js";
import { getBatchOrdersController } from "../controllers/userControl/getBatchOrders.js";

//router object
const router = express.Router();

//REGISTER || POST
router.post("/auth/register", registerController);
//REGISTER || POST
router.post("/auth/login", loginController);

const storage = multer.memoryStorage(); // Use memory storage for example
const upload = multer({ storage });
//UPLOAD PICTURE
router.put(
  "/:id/profile/image",
  upload.single("image"),
  uploadProfileController
);

router.put("/user/:id/profile/update", updateProfileController);
router.get("/:id/profile/image", getProfilePictureController);
router.get("/restaurants", getRestaurantsController);
router.post("/restaurants/batch", getBatchRestaurants);
router.post("/restaurant/items/batch", getBatchItems);
router.get("/restaurant/items/:itemId", getItemController);
router.get("/images/:imageId", getImage);
router.get("/restaurant/:id/items", getItemsController);
router.post(
  "/restaurant/item/:itemId/reviews/:userId",
  postUserReviewController
);
router.get("/restaurant/item/:itemId/reviews", getReviewsController);
router.post("/checkout", checkoutController);
router.get("/user/orders/active/:userId", getActiveOrdersController);
router.get("/user/orders/:id", getSingleOrderController);
// router.post("/orders/batch", getBatchOrdersController);
router.get("/user/history/order/:id", getHistoricOrderController);
router.get("/user/:userId/history/orders", getHistoricOrdersController);
router.get("/recommendations/:itemID", getRecommendationsController);

export default router;
