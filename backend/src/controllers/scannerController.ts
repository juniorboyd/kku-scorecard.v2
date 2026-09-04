import { Request, Response } from "express";
import { scanSingleTarget } from "../services/scannerService.ts";
import { writeAuditLog } from "../services/logService.ts";

export async function scanTargetHandler(req: Request, res: Response): Promise<void> {
  try {
    const target = req.query.target as string || req.body?.target as string;
    if (!target || typeof target !== "string") {
      res.status(400).json({ success: false, message: "Target parameter is required (e.g. ?target=kku.ac.th)" });
      return;
    }

    console.log(`[scanner] Starting live scan for target: ${target}`);
    const result = await scanSingleTarget(target);
    await writeAuditLog((req as any).user?.id || null, `LIVE_SCAN: ${target}`, "SUCCESS");

    res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    console.error("[scanner] Scan failed:", err);
    res.status(500).json({ success: false, message: `Scan failed: ${err.message}` });
  }
}
