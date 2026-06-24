import type { Request, Response } from "express";
import fs from "fs";
import {
  createImportRecord,
  startImportJob,
  startFetchJob,
  processRawCsvFile,
  reprocessLatestImport,
  getImportHistory,
  deleteImport,
} from "../services/importService.ts";
import { importMappingFile, mergeCorruptedOrganizations } from "../services/domainService.ts";
import { writeAuditLog } from "../services/logService.ts";
import prisma from "../lib/prisma.ts";

export async function uploadScoreFile(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing uploaded file" });
    const { snapshotDate, note, importMode } = req.body;
    const uploadedById = req.user?.id;

    // Create the pending record and respond immediately; the Python processing
    // runs in the background so the HTTP request never blocks on it.
    const record = await createImportRecord({
      filePath: req.file.path,
      source: "file",
      fileName: req.file.originalname,
      snapshotDate,
      note,
      importMode,
      uploadedById,
    });

    await writeAuditLog(uploadedById, `UPLOAD_FILE: ${req.file.originalname}`);
    res.json({ success: true, importId: record.id, status: record.status });

    startImportJob(record.id);
  } catch (err) {
    await writeAuditLog(req.user?.id, `UPLOAD_FILE_FAILED: ${(err as Error).message}`, "FAILED");
    if (!res.headersSent) res.status(500).json({ error: (err as Error).message });
  }
}

export async function fetchNow(req: Request, res: Response) {
  try {
    // Returns immediately; the SSC fetch + processing run in the background.
    const importId = await startFetchJob("manualFetch", req.user?.id);
    await writeAuditLog(req.user?.id, "MANUAL_FETCH");
    res.json({ success: true, importId, status: "pending" });
  } catch (err) {
    await writeAuditLog(req.user?.id, `MANUAL_FETCH_FAILED: ${(err as Error).message}`, "FAILED");
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function uploadMapping(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing mapping file" });
    const report = await importMappingFile(req.file.path);
    await writeAuditLog(req.user?.id, `UPLOAD_MAPPING: ${req.file.originalname}`);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function processFile(req: Request, res: Response) {
  try {
    const { importId } = req.body;
    if (!importId || typeof importId !== "number") return res.status(400).json({ error: "Invalid importId" });
    const result = await processRawCsvFile(importId);
    await writeAuditLog(req.user?.id, `PROCESS_FILE: importId=${importId}`);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function reprocess(req: Request, res: Response) {
  try {
    const result = await reprocessLatestImport();
    await writeAuditLog(req.user?.id, "REPROCESS_LATEST");
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function reprocessImportHandler(req: Request, res: Response) {
  try {
    const importId = Number(req.params.importId || req.body.importId);
    if (!importId) return res.status(400).json({ error: "Invalid importId" });
    const record = await prisma.import.findUnique({ where: { id: importId } });
    if (!record) return res.status(404).json({ error: "Import not found" });
    if (!record.rawPath || !fs.existsSync(record.rawPath)) {
      return res.status(400).json({ error: "Raw file not found for this import" });
    }

    // Respond immediately; reprocessing runs in the background.
    await prisma.import.update({ where: { id: importId }, data: { status: "pending", errorMessage: null } });
    await writeAuditLog(req.user?.id, `REPROCESS: importId=${importId}`);
    res.json({ success: true, importId, status: "pending" });

    startImportJob(importId);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: (err as Error).message });
  }
}

export async function getImportStatus(req: Request, res: Response) {
  try {
    const importId = Number(req.params.importId);
    if (!importId) return res.status(400).json({ error: "Invalid importId" });
    const record = await prisma.import.findUnique({
      where: { id: importId },
      select: { id: true, status: true, totalIssues: true, errorMessage: true, snapshotDate: true },
    });
    if (!record) return res.status(404).json({ error: "Import not found" });
    res.json({
      success: true,
      importId: record.id,
      status: record.status,
      totalIssues: record.totalIssues,
      error: record.errorMessage ?? null,
      snapshotDate: record.snapshotDate,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function replaceImportHandler(req: Request, res: Response) {
  try {
    const originalImportId = Number(req.body.originalImportId);
    const newImportId = req.body.newImportId ? Number(req.body.newImportId) : null;
    const confirm = req.body.confirm === "true" || req.body.confirm === true;

    if (!originalImportId) return res.status(400).json({ error: "Missing originalImportId" });

    const originalImport = await prisma.import.findUnique({ where: { id: originalImportId } });
    if (!originalImport) return res.status(404).json({ error: "Original import not found" });
    if (originalImport.status === "replaced") {
      return res.status(400).json({ error: "This import has already been replaced" });
    }

    let effectiveNewImportId = newImportId;

    // File-upload path: create a pending record using the original's snapshot date
    if (req.file && !newImportId) {
      const snapshotDate = originalImport.snapshotDate?.toISOString().split("T")[0] ?? "";
      const record = await createImportRecord({
        filePath: req.file.path,
        source: "file",
        fileName: req.file.originalname,
        snapshotDate,
        note: `Replaces import #${originalImportId}`,
        uploadedById: req.user?.id,
      });
      effectiveNewImportId = record.id;
    }

    if (!effectiveNewImportId) {
      return res.status(400).json({ error: "Provide newImportId or upload a replacement file" });
    }

    const newImport = await prisma.import.findUnique({ where: { id: effectiveNewImportId } });
    if (!newImport) return res.status(404).json({ error: "New import not found" });

    if (!confirm) {
      return res.json({
        requiresConfirmation: true,
        conflictDate: originalImport.snapshotDate,
        newImportId: effectiveNewImportId,
      });
    }

    await prisma.$transaction([
      prisma.issue.deleteMany({ where: { importId: originalImportId } }),
      prisma.import.update({ where: { id: originalImportId }, data: { status: "replaced", totalIssues: 0 } }),
      prisma.import.update({ where: { id: effectiveNewImportId }, data: { replacedImportId: originalImportId } }),
    ]);

    await writeAuditLog(req.user?.id, `REPLACE_IMPORT: originalId=${originalImportId}, newId=${effectiveNewImportId}`);
    res.json({ success: true, importId: effectiveNewImportId, status: "pending" });

    startImportJob(effectiveNewImportId);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: (err as Error).message });
  }
}

export async function deleteImportHandler(req: Request, res: Response) {
  try {
    const importId = Number(req.params.importId);
    if (!importId) return res.status(400).json({ error: "Invalid importId" });
    const result = await deleteImport(importId);
    await writeAuditLog(req.user?.id, `DELETE_IMPORT: importId=${importId}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getImports(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const status = req.query.status as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as string | undefined;
    const result = await getImportHistory({ limit, offset, status, sortBy, sortOrder });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function downloadImportFile(req: Request, res: Response) {
  try {
    const importId = Number(req.params.importId);
    if (!importId) return res.status(400).json({ error: "Invalid importId" });
    const record = await prisma.import.findUnique({ where: { id: importId } });
    if (!record) return res.status(404).json({ error: "Import not found" });
    if (!record.rawPath || !fs.existsSync(record.rawPath)) {
      return res.status(404).json({ error: "File not found on server" });
    }
    const fileName = record.fileName ?? `import-${importId}.csv`;
    res.download(record.rawPath, fileName);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function cleanupCorruptedOrgs(req: Request, res: Response) {
  try {
    const report = await mergeCorruptedOrganizations();
    await writeAuditLog(req.user?.id, "CLEANUP_CORRUPTED_ORGS");
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
