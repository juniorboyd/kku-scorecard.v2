import express from "express";
import { login, callback, logout, getMe } from "../controllers/authController.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = express.Router();

router.post("/login", login);
router.get("/callback", callback);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

export default router;
