import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {createNewVariant, updateVariant, toggleVariantStatus, getAllVariant, getAllActiveVariant, getVariantById } from "../controllers/variant.controller.js";


const router = express.Router();

router.route("/createVariant/:productid").post(authenticate,createNewVariant)
router.route("/updateVariant/:variantid").post(authenticate,updateVariant)
router.route("/toggleVariantStatus/:variantid").patch(authenticate,toggleVariantStatus)
router.route("/getAllVariant").get(authenticate,getAllVariant)
router.route("/getAllActiveVariant").get(authenticate,getAllActiveVariant)
router.route("/getVariantById/:variantid").get(authenticate,getVariantById)


export default router;