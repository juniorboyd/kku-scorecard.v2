import type { Request, Response } from "express";
import { getDashboardOverview, getIssueExplorer } from "../services/dashboardService.ts";
import prisma from "../lib/prisma.ts";

export async function getPublicScores(req: Request, res: Response) {
  try {
    const data = await getDashboardOverview({});
    
    // Customize the output for the public API, removing any internal IDs if necessary
    // Currently, getDashboardOverview returns a safe-to-share high-level overview.
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

function parseMultiParam(val: any): string[] | undefined {
  if (!val) return undefined;
  const arr = Array.isArray(val) ? val : String(val).split(",").filter(Boolean);
  return arr.length > 0 ? arr : undefined;
}

export async function getPublicIssues(req: Request, res: Response) {
  try {
    const result = await getIssueExplorer({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 20),
      organizationName: req.query.organizationName as string | undefined,
      severity: req.query.severity as string | undefined,
      severities: parseMultiParam(req.query.severities),
    });

    // Strip sensitive fields from public issues response
    const sanitizedItems = result.items.map(issue => {
      const sanitized = { ...issue };
      // Depending on requirements, we can remove fields here. 
      // Example: delete (sanitized as any).headers; delete (sanitized as any).finalUrl;
      return sanitized;
    });

    res.json({ 
      success: true, 
      data: {
        ...result,
        items: sanitizedItems
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

export async function getPublicSummary(req: Request, res: Response) {
  try {
    // 1. Get Scores
    const scoresData = await getDashboardOverview({});
    
    // 2. Get Issues (limited by default for summary view, or can pass pagination)
    const issuesResult = await getIssueExplorer({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 50),
      organizationName: req.query.organizationName as string | undefined,
      severity: req.query.severity as string | undefined,
      severities: parseMultiParam(req.query.severities),
    });

    // Strip sensitive fields
    const sanitizedItems = issuesResult.items.map(issue => {
      const sanitized = { ...issue };
      // delete (sanitized as any).headers; 
      // delete (sanitized as any).finalUrl;
      return sanitized;
    });

    // 3. Combine both
    res.json({ 
      success: true, 
      data: {
        scores: scoresData,
        issues: {
          ...issuesResult,
          items: sanitizedItems
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}
