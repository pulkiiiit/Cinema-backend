import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {createCoupon, toggleCouponStatus, updateCoupon, deleteCoupon, getAllCoupon} from "../controllers/coupon.controller..js";

const router = express.Router();

router.route("/createCoupon").post(authenticate,createCoupon)
router.route("/updateCoupon/:couponId").patch(authenticate,updateCoupon)
router.route("/deleteCoupon/:couponId").post(authenticate,deleteCoupon)
router.route("/getAllCoupon").post(authenticate,getAllCoupon)
router.route("/toggleCouponStatus/:couponId").patch(authenticate,toggleCouponStatus)


export default router;