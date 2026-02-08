import express from "express";
import { registerUser, login, logoutUser } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.route("/login").post(login);

router.route("/logoutUser").post(authenticate,logoutUser)



export default router;