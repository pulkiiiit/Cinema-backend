import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {getUserCart} from "../controllers/cart.controller.js"

const router = express.Router();

router.route("/getUserCart").get(authenticate,getUserCart)

export default router;