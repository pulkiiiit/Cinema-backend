import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// import routes 
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import categoryRouter from "./routes/category.route.js";
import subcategoryRouter from "./routes/subCategory.routes.js"
import wishlistRouter from "./routes/wishlist.route.js"
import cartRouter from "./routes/cart.routes.js"
import variantRouter from "./routes/variant.routes.js"
import couponRouter from "./routes/coupon.routes.js"

app.use("/api/users", userRouter);
app.use("/api/products",productRouter);
app.use("/api/category",categoryRouter)
app.use("/api/subcategory",subcategoryRouter)
app.use("/api/wishlist",wishlistRouter)
app.use("/api/cart",cartRouter)
app.use("/api/variant",variantRouter)
app.use("/api/coupon",couponRouter)

export default app;
