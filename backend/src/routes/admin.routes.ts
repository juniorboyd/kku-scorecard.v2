import express from "express";
import { authMiddleware, requireRole } from "../middleware/auth.ts";
import { listUsers, createUser, updateUserRole, updateUserStatus, deleteUser } from "../controllers/adminController.ts";

const router = express.Router();

router.use(authMiddleware, requireRole("ADMIN"));

router.get("/users", listUsers);
router.post("/users", express.json(), createUser);
router.patch("/users/:id/role", express.json(), updateUserRole);
router.patch("/users/:id/status", express.json(), updateUserStatus);
router.delete("/users/:id", deleteUser);

export default router;
