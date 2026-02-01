import express from "express";
import { createTestUser } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/test", createTestUser);

export default router;