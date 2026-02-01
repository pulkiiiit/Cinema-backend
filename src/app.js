import express from "express";
import cors from "cors";
import router from "./routes/user.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", router);

export default app;
