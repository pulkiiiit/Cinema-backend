import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {createPaymentOrder, verifyPayment, getPaymentStatus} from "../controllers/payment.controller.js"
const router = express.Router();

router.route("/createPaymentOrder").post(authenticate,createPaymentOrder)
router.route("/verifyPayment").post(authenticate,verifyPayment)
router.route("/status/:orderId").post(authenticate,getPaymentStatus)
router.route("/getAllPayment").post(authenticate,createPaymentOrder)

export default router;