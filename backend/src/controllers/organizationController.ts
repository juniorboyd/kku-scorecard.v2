import type { Request, Response } from "express";
import {
  getOrganizationList, getOrganizationsWithDomains, createOrganization,
  deleteOrganization, createDomainMapping, updateDomainMapping, deleteDomainMapping, importMappingFile,
  assignAndSyncIssues,
} from "../services/domainService.ts";
import { writeAuditLog } from "../services/logService.ts";

export async function listOrganizations(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search as string | undefined;
    const importId = req.query.snapshotId ? Number(req.query.snapshotId) : undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as string | undefined;
    const result = await getOrganizationList({ limit, offset, search, importId, sortBy, sortOrder });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function listOrganizationsWithDomains(req: Request, res: Response) {
  try {
    const data = await getOrganizationsWithDomains();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function addOrganization(req: Request, res: Response) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const org = await createOrganization(name);
    await writeAuditLog(req.user?.id, `CREATE_ORG: ${name}`);
    res.json({ success: true, data: org });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function removeOrganization(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await deleteOrganization(id);
    await writeAuditLog(req.user?.id, `DELETE_ORG: id=${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function addDomain(req: Request, res: Response) {
  try {
    const { name, domain } = req.body;
    if (!name || !domain) return res.status(400).json({ error: "name and domain are required" });
    const record = await createDomainMapping(name, domain);
    await writeAuditLog(req.user?.id, `CREATE_DOMAIN: ${domain} -> ${name}`);
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function editDomain(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { domain, organizationName } = req.body;
    const record = await updateDomainMapping(id, { domain, organizationName });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function removeDomain(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await deleteDomainMapping(id);
    await writeAuditLog(req.user?.id, `DELETE_DOMAIN: id=${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function assignAssetHandler(req: Request, res: Response) {
  try {
    const { domain, organizationId } = req.body;
    if (!domain || !organizationId) return res.status(400).json({ error: "domain and organizationId required" });
    const result = await assignAndSyncIssues(Number(organizationId), String(domain));
    await writeAuditLog(req.user?.id, `ASSIGN_ASSET: ${domain} -> orgId=${organizationId} (synced ${result.updatedIssueCount} issues)`);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function uploadMappingFile(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing file" });
    const report = await importMappingFile(req.file.path);
    await writeAuditLog(req.user?.id, `UPLOAD_MAPPING: ${req.file.originalname}`);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
