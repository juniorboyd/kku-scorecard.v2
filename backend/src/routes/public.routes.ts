import express from "express";
import { getPublicScores, getPublicIssues, getPublicSummary } from "../controllers/publicApiController.ts";
import { requireApiKey } from "../middleware/auth.ts";

const router = express.Router();

// Apply API key middleware to all public routes
router.use(requireApiKey);

// Public Endpoints
router.get("/scores", getPublicScores);
router.get("/issues", getPublicIssues);
router.get("/summary", getPublicSummary);

export default router;
