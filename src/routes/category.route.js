import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {createCategory,getCategoryById,updateCategory,deleteCategory,getAllProductsByCategoryId,getAllSubcategoryByCategoryId} from "../controllers/category.controller.js"


const router = express.Router();


// UNPROTECTED ROUTES
router.route("/getCategoryById/:id").get(getCategoryById)
router.route("/getAllProductsByCategoryId/:id").get(getAllProductsByCategoryId)
router.route("/getAllSubcategoryByCategoryId/:id").get(getAllSubcategoryByCategoryId)


// PROTECTED ROUTES

router.route("/createCategory").post(
    authenticate,
    upload.fields([
        {
            name: "image",
            maxCount: 1
        }
    ]),
    createCategory
)
router.route("/updateCategory/:id").patch(authenticate, 
     upload.fields([
        {
            name: "image",
            maxCount: 1
        }
     ]),
     updateCategory)
router.route("/deleteCategory/:id").delete(authenticate,deleteCategory)




export default router;