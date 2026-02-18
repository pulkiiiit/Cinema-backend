import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {addProductToUserWishlist, getUserWishlist, removeProductFromUserWishlist, clearAllWishlistOfTheUser } from "../controllers/wishlist.controller.js"

const router = express.Router();


//protected routes : 
router.route("/addProductToUserWishlist").post(authenticate,addProductToUserWishlist)
router.route("/getUserWishlist").get(authenticate,getUserWishlist)
router.route("/removeProductFromUserWishlist").delete(authenticate,removeProductFromUserWishlist)
router.route("/clearAllWishlistOfTheUser").delete(authenticate,clearAllWishlistOfTheUser)

export default router;