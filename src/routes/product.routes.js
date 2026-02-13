import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {createProduct,updateProduct,getProductById,deleteProductById} from "../controllers/product.controller.js";

const router = express.Router();


// UnProtected Route : 
router.route("/getProductById").get(getProductById)

// Protected Routes
router.route("/createProduct").post(authenticate,createProduct)
router.route("/updateProduct").patch(authenticate,updateProduct)
router.route("/deleteProductById").delete(authenticate,deleteProductById)


export default router;
