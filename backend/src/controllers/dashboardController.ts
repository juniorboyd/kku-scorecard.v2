import type { Request, Response } from "express";
import { getDashboardOverview, getIssueExplorer, getIssueFilterOptions, getAssets, getDomainList, getOrgScores, getOrgStats, getAvailableSnapshotDates, buildCsv } from "../services/dashboardService.ts";

export async function getDashboard(req: Request, res: Response) {
  try {
    const snapshotDate = req.query.snapshotDate as string | undefined;
    const snapshotId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const data = await getDashboardOverview({ snapshotDate, importId: snapshotId });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

function parseMultiParam(val: any): string[] | undefined {
  if (!val) return undefined;
  const arr = Array.isArray(val) ? val : String(val).split(",").filter(Boolean);
  return arr.length > 0 ? arr : undefined;
}

export async function getIssues(req: Request, res: Response) {
  try {
    const snapshotId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const result = await getIssueExplorer({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 20),
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      organizationName: req.query.organizationName as string | undefined,
      organizations: parseMultiParam(req.query.organizations),
      severity: req.query.severity as string | undefined,
      severities: parseMultiParam(req.query.severities),
      factor: req.query.factor as string | undefined,
      factors: parseMultiParam(req.query.factors),
      assetTypes: parseMultiParam(req.query.assetTypes),
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as string | undefined,
      importId: snapshotId ?? (req.query.importId ? Number(req.query.importId) : undefined),
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function exportIssuesHandler(req: Request, res: Response) {
  try {
    const snapshotId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const result = await getIssueExplorer({
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      organizationName: req.query.organizationName as string | undefined,
      organizations: parseMultiParam(req.query.organizations),
      severity: req.query.severity as string | undefined,
      severities: parseMultiParam(req.query.severities),
      factor: req.query.factor as string | undefined,
      factors: parseMultiParam(req.query.factors),
      assetTypes: parseMultiParam(req.query.assetTypes),
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as string | undefined,
      importId: snapshotId ?? (req.query.importId ? Number(req.query.importId) : undefined),
      exportAll: true,
    });
    const cols = [
      { key: "organizationName", header: "Organization" },
      { key: "factorName", header: "Factor" },
      { key: "issueTypeTitle", header: "Issue Type" },
      { key: "severity", header: "Severity" },
      { key: "asset", header: "Asset" },
      { key: "finalUrl", header: "URL" },
      { key: "headers", header: "Headers" },
      { key: "scoreImpact", header: "Impact" },
    ];
    const date = new Date().toISOString().split("T")[0];
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="issues_export_${date}.csv"`);
    res.send(buildCsv(result.items, cols));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getIssueFiltersHandler(req: Request, res: Response) {
  try {
    const snapshotId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const result = await getIssueFilterOptions(snapshotId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getAssetsHandler(req: Request, res: Response) {
  try {
    const parseMulti = (val: any): string[] | undefined => {
      if (!val) return undefined;
      const arr = String(val).split(",").filter(Boolean);
      return arr.length > 0 ? arr : undefined;
    };
    const snapshotId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const assignedRaw = req.query.assigned as string | undefined;
    const assigned =
      assignedRaw === "known" || assignedRaw === "unassigned" || assignedRaw === "all"
        ? assignedRaw
        : undefined;
    const result = await getAssets({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 20),
      search: req.query.search as string | undefined,
      assigned,
      organizations: parseMulti(req.query.organizations),
      types: parseMulti(req.query.types),
      importId: snapshotId,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as string | undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getDomainListHandler(req: Request, res: Response) {
  try {
    const parseMulti = (val: any): string[] | undefined => {
      if (!val) return undefined;
      const arr = String(val).split(",").filter(Boolean);
      return arr.length > 0 ? arr : undefined;
    };
    const snapshotId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const result = await getDomainList({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 20),
      search: req.query.search as string | undefined,
      organizations: parseMulti(req.query.organizations),
      types: parseMulti(req.query.types),
      statuses: parseMulti(req.query.statuses),
      importId: snapshotId,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as string | undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getOrgScoresHandler(req: Request, res: Response) {
  try {
    const snapshotId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const data = await getOrgScores({ importId: snapshotId });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function exportAssetsHandler(req: Request, res: Response) {
  try {
    const parseMulti = (val: any): string[] | undefined => {
      if (!val) return undefined;
      const arr = String(val).split(",").filter(Boolean);
      return arr.length > 0 ? arr : undefined;
    };
    const snapshotId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const format = req.query.format === "mapping" ? "mapping" : "full";
    const assignedRaw = req.query.assigned as string | undefined;
    const assigned = assignedRaw === "known" || assignedRaw === "unassigned" ? assignedRaw : undefined;
    const result = await getAssets({
      search: req.query.search as string | undefined,
      assigned,
      organizations: parseMulti(req.query.organizations),
      types: parseMulti(req.query.types),
      importId: snapshotId,
      exportAll: true,
    });
    const cols =
      format === "mapping"
        ? [{ key: "host", header: "url" }, { key: "organization", header: "org" }]
        : [
            { key: "host", header: "Asset / Domain" },
            { key: "type", header: "Type" },
            { key: "organization", header: "Organization" },
            { key: "issueCount", header: "Issues" },
          ];
    const date = new Date().toISOString().split("T")[0];
    const filename = format === "mapping" ? `url_org_mapping_${date}.csv` : `assets_export_${date}.csv`;
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buildCsv(result.items, cols));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function exportDomainsHandler(req: Request, res: Response) {
  try {
    const parseMulti = (val: any): string[] | undefined => {
      if (!val) return undefined;
      const arr = String(val).split(",").filter(Boolean);
      return arr.length > 0 ? arr : undefined;
    };
    const snapshotId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const format = req.query.format === "mapping" ? "mapping" : "full";
    const result = await getDomainList({
      search: req.query.search as string | undefined,
      organizations: parseMulti(req.query.organizations),
      types: parseMulti(req.query.types),
      statuses: parseMulti(req.query.statuses),
      importId: snapshotId,
      exportAll: true,
    });
    const cols =
      format === "mapping"
        ? [{ key: "domain", header: "url" }, { key: "organization", header: "org" }]
        : [
            { key: "domain", header: "Asset" },
            { key: "type", header: "Type" },
            { key: "organization", header: "Organization" },
            { key: "status", header: "Status" },
            { key: "issueCount", header: "Issues" },
          ];
    const date = new Date().toISOString().split("T")[0];
    const filename = format === "mapping" ? `url_org_mapping_${date}.csv` : `organizations_export_${date}.csv`;
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buildCsv(result.items, cols));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getSnapshotDates(_req: Request, res: Response) {
  try {
    const dates = await getAvailableSnapshotDates();
    res.json({ success: true, data: dates });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getOrgStatsHandler(req: Request, res: Response) {
  try {
    const snapshotId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const data = await getOrgStats({ importId: snapshotId });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
