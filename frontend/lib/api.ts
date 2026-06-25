import axios from "axios";

axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  timeout: 60000,
  withCredentials: true,
});

const PUBLIC_PATHS = ["/", "/login"];

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (
      err.response?.status === 401 &&
      typeof window !== "undefined" &&
      !PUBLIC_PATHS.includes(window.location.pathname)
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (body?: any) => api.post("/auth/login", body).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

// Snapshots (global)
export const snapshotsApi = {
  list: () => api.get("/api/snapshots").then((r) => r.data),
};

// Dashboard
export const dashboardApi = {
  getOverview: (params?: { snapshotDate?: string; snapshotId?: number }) =>
    api.get("/api/dashboard", { params: params ?? {} }).then((r) => r.data),
  getSnapshots: () => api.get("/api/dashboard/snapshots").then((r) => r.data),
  getOrgScores: (snapshotId?: number) =>
    api.get("/api/dashboard/org-scores", { params: snapshotId ? { snapshotId } : {} }).then((r) => r.data),
};

// Issues
export const issuesApi = {
  getIssues: (params: {
    page?: number; pageSize?: number; search?: string;
    organizationName?: string; organizations?: string[];
    severity?: string; severities?: string[];
    factor?: string; factors?: string[];
    assetTypes?: string[];
    dateFrom?: string; dateTo?: string;
    importId?: number; snapshotId?: number;
    sortBy?: string; sortOrder?: string;
  }) => {
    const p: Record<string, any> = { ...params };
    if (params.organizations?.length) p.organizations = params.organizations.join(",");
    if (params.severities?.length) p.severities = params.severities.join(",");
    if (params.factors?.length) p.factors = params.factors.join(",");
    if (params.assetTypes?.length) p.assetTypes = params.assetTypes.join(",");
    return api.get("/api/issues", { params: p }).then((r) => r.data);
  },
  getFilterOptions: (snapshotId?: number | null) =>
    api.get("/api/issues/filters", { params: snapshotId ? { snapshotId } : {} }).then((r) => r.data),
  exportCsv: (params: {
    search?: string;
    organizations?: string[]; severities?: string[]; factors?: string[]; assetTypes?: string[];
    sortBy?: string; sortOrder?: string; snapshotId?: number | null;
  }) => {
    const p: Record<string, any> = {};
    if (params.search) p.search = params.search;
    if (params.organizations?.length) p.organizations = params.organizations.join(",");
    if (params.severities?.length) p.severities = params.severities.join(",");
    if (params.factors?.length) p.factors = params.factors.join(",");
    if (params.assetTypes?.length) p.assetTypes = params.assetTypes.join(",");
    if (params.sortBy) p.sortBy = params.sortBy;
    if (params.sortOrder) p.sortOrder = params.sortOrder;
    if (params.snapshotId) p.snapshotId = params.snapshotId;
    return api.get("/api/issues/export", { params: p, responseType: "arraybuffer" });
  },
};

// Assets — source: Issue table (SSC report). Every asset is Vulnerable or Unassigned.
export const assetsApi = {
  getAssets: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    assigned?: "all" | "known" | "unassigned";
    organizations?: string[];
    types?: string[];
    snapshotId?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const p: Record<string, any> = {};
    if (params.page) p.page = params.page;
    if (params.pageSize) p.pageSize = params.pageSize;
    if (params.search) p.search = params.search;
    if (params.assigned && params.assigned !== "all") p.assigned = params.assigned;
    if (params.organizations?.length) p.organizations = params.organizations.join(",");
    if (params.types?.length) p.types = params.types.join(",");
    if (params.snapshotId) p.snapshotId = params.snapshotId;
    if (params.sortBy) p.sortBy = params.sortBy;
    if (params.sortOrder) p.sortOrder = params.sortOrder;
    return api.get("/api/assets", { params: p }).then((r) => r.data);
  },
  exportCsv: (params: {
    search?: string;
    assigned?: "all" | "known" | "unassigned";
    organizations?: string[];
    types?: string[];
    snapshotId?: number;
    format: "full" | "mapping";
  }) => {
    const p: Record<string, any> = { format: params.format };
    if (params.search) p.search = params.search;
    if (params.assigned && params.assigned !== "all") p.assigned = params.assigned;
    if (params.organizations?.length) p.organizations = params.organizations.join(",");
    if (params.types?.length) p.types = params.types.join(",");
    if (params.snapshotId) p.snapshotId = params.snapshotId;
    return api.get("/api/assets/export", { params: p, responseType: "arraybuffer" });
  },
};

// Domains — source: Domain table (master registry). Status per domain vs current snapshot.
export const domainsApi = {
  list: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    organizations?: string[];
    types?: string[];
    statuses?: string[];
    snapshotId?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const p: Record<string, any> = {};
    if (params.page) p.page = params.page;
    if (params.pageSize) p.pageSize = params.pageSize;
    if (params.search) p.search = params.search;
    if (params.organizations?.length) p.organizations = params.organizations.join(",");
    if (params.types?.length) p.types = params.types.join(",");
    if (params.statuses?.length) p.statuses = params.statuses.join(",");
    if (params.snapshotId) p.snapshotId = params.snapshotId;
    if (params.sortBy) p.sortBy = params.sortBy;
    if (params.sortOrder) p.sortOrder = params.sortOrder;
    return api.get("/api/domains", { params: p }).then((r) => r.data);
  },
  exportCsv: (params: {
    search?: string;
    organizations?: string[];
    types?: string[];
    statuses?: string[];
    snapshotId?: number;
    format: "full" | "mapping";
  }) => {
    const p: Record<string, any> = { format: params.format };
    if (params.search) p.search = params.search;
    if (params.organizations?.length) p.organizations = params.organizations.join(",");
    if (params.types?.length) p.types = params.types.join(",");
    if (params.statuses?.length) p.statuses = params.statuses.join(",");
    if (params.snapshotId) p.snapshotId = params.snapshotId;
    return api.get("/api/organizations/export", { params: p, responseType: "arraybuffer" });
  },
};

// Organizations
export const orgsApi = {
  list: (params?: { limit?: number; offset?: number; search?: string; snapshotId?: number; sortBy?: string; sortOrder?: string }) =>
    api.get("/api/organizations", { params }).then((r) => r.data),
  getStats: (snapshotId?: number) =>
    api.get("/api/organizations/stats", { params: snapshotId ? { snapshotId } : {} }).then((r) => r.data),
  assignAsset: (body: { domain: string; organizationId: number }) =>
    api.post("/api/organizations/assets", body).then((r) => r.data),
  listWithDomains: () => api.get("/api/organizations/with-domains").then((r) => r.data),
  create: (name: string) => api.post("/api/organizations", { name }).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/organizations/${id}`).then((r) => r.data),
  addDomain: (body: { name: string; domain: string }) => api.post("/api/domains", body).then((r) => r.data),
  editDomain: (id: number, body: { domain?: string; organizationName?: string }) =>
    api.patch(`/api/domains/${id}`, body).then((r) => r.data),
  deleteDomain: (id: number) => api.delete(`/api/domains/${id}`).then((r) => r.data),
  uploadMapping: (file: File) => {
    const form = new FormData(); form.append("mappingFile", file);
    return api.post("/api/mapping/upload", form).then((r) => r.data);
  },
};

// Imports
export const importsApi = {
  list: (params?: { limit?: number; offset?: number; status?: string; sortBy?: string; sortOrder?: string }) =>
    api.get("/api/imports", { params }).then((r) => r.data),
  upload: (file: File, opts?: { snapshotDate?: string; note?: string; importMode?: string }) => {
    const form = new FormData(); form.append("scoreFile", file);
    if (opts?.snapshotDate) form.append("snapshotDate", opts.snapshotDate);
    if (opts?.note) form.append("note", opts.note);
    if (opts?.importMode) form.append("importMode", opts.importMode ?? "create");
    return api.post("/api/imports/upload", form).then((r) => r.data);
  },
  fetchFromApi: () => api.post("/api/imports/fetch").then((r) => r.data),
  getStatus: (importId: number) => api.get(`/api/imports/${importId}/status`).then((r) => r.data),
  reprocess: (importId: number) => api.post(`/api/imports/${importId}/reprocess`).then((r) => r.data),
  download: (importId: number) => api.get(`/api/imports/${importId}/download`, { responseType: "blob" }),
  delete: (importId: number) => api.delete(`/api/imports/${importId}`).then((r) => r.data),
  replace: (data: { originalImportId: number; newImportId?: number; confirm?: boolean }, file?: File) => {
    const form = new FormData();
    form.append("originalImportId", String(data.originalImportId));
    if (data.newImportId) form.append("newImportId", String(data.newImportId));
    if (data.confirm) form.append("confirm", "true");
    if (file) form.append("newFile", file);
    return api.post("/api/imports/replace", form).then((r) => r.data);
  },
  cleanupOrgs: () => api.post("/api/imports/cleanup-orgs").then((r) => r.data),
};

// Settings
export const settingsApi = {
  getScorecardKey: () => api.get("/api/settings/scorecard-key").then((r) => r.data),
  updateScorecardKey: (apiKey: string) =>
    api.post("/api/settings/scorecard-key", { apiKey }).then((r) => r.data),
};

// Logs
export const logsApi = {
  list: (params?: { limit?: number; offset?: number; status?: string; sortBy?: string; sortOrder?: string }) =>
    api.get("/api/logs", { params }).then((r) => r.data),
};

// Admin
export const adminApi = {
  listUsers: (params?: { search?: string; role?: string; status?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: string }) =>
    api.get("/api/admin/users", { params }).then((r) => r.data),
  createUser: (body: { email: string; role?: string; note?: string }) =>
    api.post("/api/admin/users", body).then((r) => r.data),
  updateRole: (id: number, role: string) =>
    api.patch(`/api/admin/users/${id}/role`, { role }).then((r) => r.data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/api/admin/users/${id}/status`, { status }).then((r) => r.data),
  deleteUser: (id: number) =>
    api.delete(`/api/admin/users/${id}`).then((r) => r.data),
};

// Network Map
export const networkApi = {
  getTopology: () => api.get("/api/network/topology").then((r) => r.data),
};

