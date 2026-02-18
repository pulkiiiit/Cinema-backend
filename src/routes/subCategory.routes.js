import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {createSubcategory, readSubcategoryById, updateSubcategory, deleteSubcategory} from "../controllers/subCategory.controller.js" 

const router = express.Router()


router.route("/createSubcategory").post(createSubcategory)
router.route("/readSubcategoryById/:id").get(readSubcategoryById)
router.route("/updateSubcategory/:id").patch(updateSubcategory)
router.route("/deleteSubcategory/:id").delete(deleteSubcategory)


export default router;
