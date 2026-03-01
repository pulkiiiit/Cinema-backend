import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {createOrder, getUserOrder, getOrderId, cancelOrder} from "../controllers/order.controller.js"

const router = express.Router();

router.route("/createOrder").post(authenticate,createOrder)
router.route("/getUserOrder").get(authenticate,getUserOrder)
router.route("/getOrderId/:orderId").get(authenticate,getOrderId)
router.route("/cancelOrder/:orderId").patch(authenticate,cancelOrder)

export default router;