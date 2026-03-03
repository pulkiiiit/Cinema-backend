import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {createPaymentOrder} from "../controllers/payment.controller.js"

const router = express.Router();

router.route("/createPaymentOrder").post(authenticate,createPaymentOrder)

export default router;