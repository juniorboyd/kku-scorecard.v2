import express from "express";
import { login, callback, logout, getMe, setup2Fa, verifySetup2Fa, disable2Fa, login2Fa } from "../controllers/authController.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = express.Router();

router.post("/login", login);
router.get("/callback", callback);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

// 2FA Routes
router.post("/2fa/setup", authMiddleware, setup2Fa);
router.post("/2fa/verify", authMiddleware, verifySetup2Fa);
router.post("/2fa/disable", authMiddleware, disable2Fa);
router.post("/2fa/login", login2Fa);

export default router;
