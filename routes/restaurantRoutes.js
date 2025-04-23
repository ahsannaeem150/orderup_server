import express from "express";
import multer from "multer";

import { registerController } from "../controllers/restaurantControllers/registerRestaurant.js";
import { loginController } from "../controllers/restaurantControllers/loginRestaurant.js";
import { uploadProfileController } from "../controllers/restaurantControllers/uploadProfilePicture.js";
import { getProfilePictureController } from "../controllers/restaurantControllers/getProfilePicture.js";
import { addMenuItemController } from "../controllers/restaurantControllers/itemUpload.js";
import { getItemsController } from "../controllers/restaurantControllers/getItems.js";
import { getItemController } from "../controllers/restaurantControllers/getItem.js";
import { deleteItemController } from "../controllers/restaurantControllers/deleteItem.js";
import { updateProfileController } from "../controllers/restaurantControllers/updateProfile.js";
import { getRestaurantOrders } from "../controllers/restaurantControllers/getRestaurantOrders.js";
import { getActiveOrdersController } from "../controllers/restaurantControllers/getActiveOrders.js";
import { getSingleOrderController } from "../controllers/restaurantControllers/getSingleOrder.js";
import { getHistoricOrderController } from "../controllers/restaurantControllers/getHistoricOrder.js";
import { getHistoricOrdersController } from "../controllers/restaurantControllers/getHistoricOrders.js";
import { updateItemController } from "../controllers/restaurantControllers/updateItem.js";

//router object
const router = express.Router();

//REGISTER || POST
router.post("/auth/register/restaurant", registerController);

//LOGIN || POST
router.post("/auth/login/restaurant", loginController);

const storage = multer.memoryStorage(); // Use memory storage
const upload = multer({ storage });
//UPDATE PROFILE PICTURE
router.put(
  "/restaurant/:id/profile/:type",
  upload.single("image"),
  uploadProfileController
);

router.post(
  "/restaurant/:id/menuitems/",
  upload.single("image"),
  addMenuItemController
);

router.put("/restaurant/:id/update", updateProfileController);
router.get("/restaurant/:id/profile/:type", getProfilePictureController);
router.get("/restaurant/:id/items", getItemsController);
router.get("/restaurant/:restaurantId/item/:itemId", getItemController);
router.delete("/restaurant/:restaurantId/item/:itemId", deleteItemController);
router.patch(
  "/restaurant/:restaurantId/items/:itemId",
  upload.single("image"),
  updateItemController
);

//orders
router.get("/:restaurantId/orders", getRestaurantOrders);
router.get(
  "/restaurant/orders/active/:restaurantId",
  getActiveOrdersController
);
router.get("/restaurant/orders/:id", getSingleOrderController);
router.get("/restaurant/history/order/:id", getHistoricOrderController);
router.get(
  "/restaurant/:restaurantId/history/orders",
  getHistoricOrdersController
);

export default router;
