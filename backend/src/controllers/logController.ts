import type { Request, Response } from "express";
import { getAuditLogs } from "../services/logService.ts";
import type { AuditStatus } from "@prisma/client";

export async function getLogs(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const status = req.query.status as AuditStatus | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as string | undefined;

    const result = await getAuditLogs({ limit, offset, userId, status, sortBy, sortOrder });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
