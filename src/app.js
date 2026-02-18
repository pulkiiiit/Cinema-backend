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
import subcategory from "./routes/subCategory.routes.js"


app.use("/api/users", userRouter);
app.use("/api/products",productRouter);
app.use("/api/category",categoryRouter)
app.use("/api/subcategory",subcategory)

export default app;
