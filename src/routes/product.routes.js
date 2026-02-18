import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {createProduct,updateProduct,getProductById,deleteProductById, getAllProduct} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();


// UnProtected Route : 
router.route("/getProductById/:id").get(getProductById)
router.route("/getAllProduct").get(getAllProduct)

// Protected Routes
router.route("/createProduct").post(
    upload.array("variantImages", 10),
    createProduct)
router.route("/updateProduct").patch(authenticate,updateProduct)
router.route("/deleteProductById").delete(authenticate,deleteProductById)


export default router;  
