import type { Request, Response } from "express";
import { getScorecardApiKey, setScorecardApiKey, maskKey, validateScorecardApiKey } from "../services/settingsService.ts";
import { writeAuditLog } from "../services/logService.ts";

// GET /api/settings/scorecard-key — returns only a masked view, never the key.
export async function getScorecardKey(_req: Request, res: Response) {
  try {
    const key = await getScorecardApiKey();
    res.json({ configured: !!key, masked: key ? maskKey(key) : null });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

// POST /api/settings/scorecard-key  body: { apiKey } — encrypts + upserts.
export async function updateScorecardKey(req: Request, res: Response) {
  try {
    const apiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
    if (!apiKey) return res.status(400).json({ error: "apiKey is required" });

    // Verify the key actually works against SSC before persisting it.
    const result = await validateScorecardApiKey(apiKey);
    if (!result.ok) {
      if (result.reason === "invalid") {
        await writeAuditLog(req.user?.id, "UPDATE_SCORECARD_API_KEY_INVALID", "FAILED");
        return res.status(400).json({ error: "API Key ไม่ถูกต้องหรือหมดอายุแล้ว" });
      }
      return res.status(502).json({ error: "ไม่สามารถเชื่อมต่อ SecurityScorecard ได้" });
    }

    await setScorecardApiKey(apiKey, req.user?.id);
    await writeAuditLog(req.user?.id, "UPDATE_SCORECARD_API_KEY");
    res.json({ success: true, masked: maskKey(apiKey) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
