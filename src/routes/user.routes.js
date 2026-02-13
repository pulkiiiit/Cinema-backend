import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import { registerUser, login, logoutUser, updateUser, updatePassword, getUserDetails } from "../controllers/user.controller.js";


const router = express.Router();

router.route("/register").post(
    upload.single([
        {
            name:"image",
            maxCount:1
        }
    ]), 
    registerUser
);
router.route("/login").post(login);


//protected routes

router.route("/logoutUser").post(authenticate,logoutUser)
router.route("/updateUser").patch(authenticate,updateUser)
router.route("/updatePassword").patch(authenticate,updatePassword)
router.route("/getUserDetails").get(authenticate,getUserDetails)



export default router;