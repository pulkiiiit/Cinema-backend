import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {getUserCart, addItemToCart, removeCartItem, reduceItemQuantity, deleteEntireCart, validateCart, applyCouponToCart, DeleteCouponToCart} from "../controllers/cart.controller.js"

const router = express.Router();

router.route("/getUserCart").get(authenticate,getUserCart)
router.route("/addItemToCart").post(authenticate,addItemToCart)
router.route("/removeCartItem").delete(authenticate,removeCartItem)
router.route("/reduceItemQuantity").delete(authenticate,reduceItemQuantity)
router.route("/deleteEntireCart").delete(authenticate,deleteEntireCart)
router.route("/validateCart").post(authenticate,validateCart)
router.route("/applyCouponToCart").post(authenticate,applyCouponToCart)
router.route("/DeleteCouponToCart").delete(authenticate,DeleteCouponToCart)



export default router;