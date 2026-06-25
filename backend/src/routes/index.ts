import express from "express";
import multer from "multer";
import path from "path";
import { UPLOAD_DIR } from "../config.ts";
import { authMiddleware, requireRole } from "../middleware/auth.ts";

// Controllers
import { uploadScoreFile, fetchNow, uploadMapping, processFile, reprocess, reprocessImportHandler, replaceImportHandler, deleteImportHandler, getImports, getImportStatus, cleanupCorruptedOrgs, downloadImportFile } from "../controllers/importController.ts";
import { listOrganizations, listOrganizationsWithDomains, addOrganization, removeOrganization, addDomain, editDomain, removeDomain, assignAssetHandler } from "../controllers/organizationController.ts";
import { getDashboard, getIssues, exportIssuesHandler, getIssueFiltersHandler, getAssetsHandler, getDomainListHandler, getOrgScoresHandler, getOrgStatsHandler, getSnapshotDates, exportAssetsHandler, exportDomainsHandler } from "../controllers/dashboardController.ts";
import { getLogs } from "../controllers/logController.ts";
import { getScorecardKey, updateScorecardKey } from "../controllers/settingsController.ts";
import adminRoutes from "./admin.routes.ts";

const router = express.Router();

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Dashboard
router.get("/dashboard", authMiddleware, getDashboard);
router.get("/dashboard/snapshots", authMiddleware, getSnapshotDates);
router.get("/dashboard/org-scores", authMiddleware, getOrgScoresHandler);
router.get("/snapshots", authMiddleware, getSnapshotDates);
router.get("/issues", authMiddleware, getIssues);
router.get("/issues/export", authMiddleware, exportIssuesHandler);
router.get("/issues/filters", authMiddleware, getIssueFiltersHandler);
router.get("/assets", authMiddleware, getAssetsHandler);
router.get("/assets/export", authMiddleware, exportAssetsHandler);

// Import
router.get("/imports", authMiddleware, getImports);
router.post("/imports/upload", authMiddleware, requireRole("ADMIN", "ANALYST"), upload.single("scoreFile"), uploadScoreFile);
router.post("/imports/fetch", authMiddleware, requireRole("ADMIN", "ANALYST"), fetchNow);
router.post("/imports/process", authMiddleware, requireRole("ADMIN", "ANALYST"), express.json(), processFile);
router.post("/imports/reprocess", authMiddleware, requireRole("ADMIN", "ANALYST"), reprocess);
router.post("/imports/:importId/reprocess", authMiddleware, requireRole("ADMIN", "ANALYST"), reprocessImportHandler);
router.post("/imports/replace", authMiddleware, requireRole("ADMIN"), upload.single("newFile"), replaceImportHandler);
router.get("/imports/:importId/status", authMiddleware, getImportStatus);
router.get("/imports/:importId/download", authMiddleware, downloadImportFile);
router.delete("/imports/:importId", authMiddleware, requireRole("ADMIN", "ANALYST"), deleteImportHandler);
router.post("/imports/cleanup-orgs", authMiddleware, requireRole("ADMIN"), cleanupCorruptedOrgs);

// Mapping
router.post("/mapping/upload", authMiddleware, requireRole("ADMIN", "ANALYST"), upload.single("mappingFile"), uploadMapping);

// Organizations
router.get("/organizations", authMiddleware, listOrganizations);
router.get("/organizations/stats", authMiddleware, getOrgStatsHandler);
router.get("/organizations/with-domains", authMiddleware, listOrganizationsWithDomains);
router.get("/organizations/export", authMiddleware, exportDomainsHandler);
router.post("/organizations", authMiddleware, requireRole("ADMIN", "ANALYST"), express.json(), addOrganization);
router.post("/organizations/assets", authMiddleware, requireRole("ADMIN", "ANALYST"), express.json(), assignAssetHandler);
router.delete("/organizations/:id", authMiddleware, requireRole("ADMIN"), removeOrganization);

// Domains
router.get("/domains", authMiddleware, getDomainListHandler);
router.post("/domains", authMiddleware, requireRole("ADMIN", "ANALYST"), express.json(), addDomain);
router.patch("/domains/:id", authMiddleware, requireRole("ADMIN", "ANALYST"), express.json(), editDomain);
router.delete("/domains/:id", authMiddleware, requireRole("ADMIN", "ANALYST"), removeDomain);

// Logs
router.get("/logs", authMiddleware, requireRole("ADMIN", "ANALYST"), getLogs);

// Settings
router.get("/settings/scorecard-key", authMiddleware, requireRole("ADMIN"), getScorecardKey);
router.post("/settings/scorecard-key", authMiddleware, requireRole("ADMIN"), express.json(), updateScorecardKey);

// Admin
router.use("/admin", adminRoutes);

// Network Map
import { getTopologyHandler } from "../controllers/networkController.ts";
router.get("/network/topology", authMiddleware, getTopologyHandler);

export default router;
