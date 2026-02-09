import express from "express";
import { registerUser, login, logoutUser, updateUser, updatePassword, getUserDetails } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.route("/login").post(login);


//protected routes

router.route("/logoutUser").post(authenticate,logoutUser)
router.route("/updateUser").patch(authenticate,updateUser)
router.route("/updatePassword").patch(authenticate,updatePassword)
router.route("/getUserDetails").get(authenticate,getUserDetails)



export default router;