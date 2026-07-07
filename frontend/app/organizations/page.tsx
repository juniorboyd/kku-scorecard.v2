"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit2, Upload, Search, Building2, AlertTriangle, Filter, X, Download, ChevronDown, TrendingUp } from "lucide-react";
import KpiCard from "@/components/ui/KpiCard";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";
import OrgCombobox from "@/components/ui/OrgCombobox";
import { orgsApi, domainsApi, importsApi } from "@/lib/api";
import { useCanEdit } from "@/lib/me";
import { useToast } from "@/lib/toast";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

function triggerCsvDownload(data: ArrayBuffer, filename: string) {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
import { useSnapshot } from "@/lib/snapshotContext";

const ORG_PAGE_SIZE = 5;
const ASSET_PAGE_SIZE = 20;

type AssetFilters = { organizations: string[]; types: string[]; statuses: string[] };

const STATUS_STYLES: Record<string, string> = {
  Vulnerable: "text-red-700 bg-red-50",
  Healthy: "text-green-700 bg-green-50",
  Unassigned: "text-gray-600 bg-gray-100",
};

const ASSET_TYPE_OPTIONS = [
  { value: "web", label: "Web" },
  { value: "ip",  label: "IP Address" },
];

const ASSET_TYPE_DISPLAY: Record<string, { label: string; style: string }> = {
  web: { label: "Web",        style: "text-blue-700 bg-blue-50" },
  dns: { label: "DNS",        style: "text-purple-700 bg-purple-50" },
  ip:  { label: "IP Address", style: "text-orange-700 bg-orange-50" },
  network: { label: "Network", style: "text-teal-700 bg-teal-50" },
  global:  { label: "Global",  style: "text-gray-500 bg-gray-100" },
};

const EMPTY_FILTERS: AssetFilters = { organizations: [], types: [], statuses: [] };

export default function OrganizationsPage() {
  const { selectedSnapshotId } = useSnapshot();
  const router = useRouter();
  const canEdit = useCanEdit();
  const toast = useToast();

  // ── Stats (KPI cards) ────────────────────────────────────────────
  const [stats, setStats] = useState<{ totalOrganizations: number; totalAssets: number; unassignedAssets: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Org table state ──────────────────────────────────────────────
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [orgSortBy, setOrgSortBy] = useState("name");
  const [orgSortOrder, setOrgSortOrder] = useState<"asc" | "desc">("asc");

  // Modals
  const [addOrgOpen, setAddOrgOpen] = useState(false);
  const [addDomainOpen, setAddDomainOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editDomainOpen, setEditDomainOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<any>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyOrg, setHistoryOrg] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form state
  const [newOrgName, setNewOrgName] = useState("");
  const [newDomain, setNewDomain] = useState({ name: "", domain: "" });
  const [editDomainForm, setEditDomainForm] = useState({ domain: "", organizationName: "" });
  const [mappingFile, setMappingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // ── Asset Explorer state ─────────────────────────────────────────
  const [assetPage, setAssetPage] = useState(1);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetData, setAssetData] = useState<any>(null);
  const [assetLoading, setAssetLoading] = useState(true);
  const [assetSortBy, setAssetSortBy] = useState("issueCount");
  const [assetSortOrder, setAssetSortOrder] = useState<"asc" | "desc">("desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<AssetFilters>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<AssetFilters>(EMPTY_FILTERS);
  const [allOrgs, setAllOrgs] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // ── Loaders ──────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    if (selectedSnapshotId === null) return;
    setStatsLoading(true);
    try {
      const r = await orgsApi.getStats(selectedSnapshotId);
      setStats(r.data);
    } finally { setStatsLoading(false); }
  }, [selectedSnapshotId]);

  const loadOrgs = useCallback(async () => {
    if (selectedSnapshotId === null) return;
    setLoading(true);
    try {
      const r = await orgsApi.list({ limit: ORG_PAGE_SIZE, offset: (page - 1) * ORG_PAGE_SIZE, search, snapshotId: selectedSnapshotId, sortBy: orgSortBy, sortOrder: orgSortOrder });
      setData(r);
    } finally { setLoading(false); }
  }, [page, search, selectedSnapshotId, orgSortBy, orgSortOrder]);

  const loadAssets = useCallback(async () => {
    if (selectedSnapshotId === null) return;
    setAssetLoading(true);
    try {
      const r = await domainsApi.list({
        page: assetPage,
        pageSize: ASSET_PAGE_SIZE,
        search: assetSearch || undefined,
        organizations: activeFilters.organizations.length ? activeFilters.organizations : undefined,
        types: activeFilters.types.length ? activeFilters.types : undefined,
        statuses: activeFilters.statuses.length ? activeFilters.statuses : undefined,
        snapshotId: selectedSnapshotId,
        sortBy: assetSortBy,
        sortOrder: assetSortOrder,
      });
      setAssetData(r.data);
    } finally { setAssetLoading(false); }
  }, [assetPage, assetSearch, activeFilters, selectedSnapshotId, assetSortBy, assetSortOrder]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadOrgs(); }, [loadOrgs]);
  useEffect(() => { loadAssets(); }, [loadAssets]);

  // Fetch all org names once for the filter panel
  useEffect(() => {
    orgsApi.list({ limit: 1000 }).then((r) =>
      setAllOrgs((r.items ?? []).map((o: any) => o.name).sort((a: string, b: string) => a.localeCompare(b, "th")))
    );
  }, []);

  // Close filter panel on outside click
  useEffect(() => {
    if (!filterOpen) return;
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  useEffect(() => {
    if (!exportOpen) return;
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [exportOpen]);

  async function handleExport(format: "full" | "mapping") {
    setExportOpen(false);
    try {
      const r = await domainsApi.exportCsv({
        search: assetSearch || undefined,
        organizations: activeFilters.organizations.length ? activeFilters.organizations : undefined,
        types: activeFilters.types.length ? activeFilters.types : undefined,
        statuses: activeFilters.statuses.length ? activeFilters.statuses : undefined,
        snapshotId: selectedSnapshotId ?? undefined,
        format,
      });
      const date = new Date().toISOString().split("T")[0];
      const filename = format === "mapping" ? `url_org_mapping_${date}.csv` : `organizations_export_${date}.csv`;
      triggerCsvDownload(r.data as ArrayBuffer, filename);
    } catch { /* silent */ }
  }

  // ── Org CRUD ─────────────────────────────────────────────────────
  async function createOrg() {
    if (!newOrgName.trim()) return;
    const name = newOrgName.trim();
    setSaving(true);
    try {
      await orgsApi.create(name);
      setNewOrgName(""); setAddOrgOpen(false); loadOrgs();
      setAllOrgs((prev) => [...prev, name].sort((a, b) => a.localeCompare(b, "th")));
      toast.success(`Organization "${name}" added`);
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
    } finally { setSaving(false); }
  }

  // Create an org inline from the Add Asset combobox, then keep allOrgs in sync.
  async function createOrgInline(name: string) {
    const trimmed = name.trim();
    try {
      await orgsApi.create(trimmed);
      setAllOrgs((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed].sort((a, b) => a.localeCompare(b, "th"))));
      loadOrgs();
      toast.success(`Organization "${trimmed}" added`);
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
      throw e; // let the combobox know creation failed (won't auto-select)
    }
  }

  async function createDomain() {
    if (!newDomain.name || !newDomain.domain) return;
    setSaving(true);
    try {
      await orgsApi.addDomain(newDomain);
      toast.success(`Asset "${newDomain.domain}" added`);
      setNewDomain({ name: "", domain: "" }); setAddDomainOpen(false); loadAssets();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
    } finally { setSaving(false); }
  }

  async function uploadBulk() {
    if (!mappingFile) return;
    setSaving(true);
    try {
      const r = await orgsApi.uploadMapping(mappingFile);
      const summary = `Imported: ${r.report?.created ?? 0} created, ${r.report?.skipped ?? 0} skipped`;
      setMsg(summary);
      toast.success(summary);
      setMappingFile(null); loadAssets();
    } catch (e: any) {
      setMsg(`Error: ${e.response?.data?.error ?? e.message}`);
      toast.error(e.response?.data?.error ?? e.message);
    } finally { setSaving(false); }
  }

  async function handleCleanup() {
    setSaving(true);
    try {
      await importsApi.cleanupOrgs();
      toast.success("Cleanup completed successfully");
      loadOrgs();
      loadAssets();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
    } finally { setSaving(false); }
  }

  async function deleteOrg(id: number) {
    if (!confirm("Delete this organization?")) return;
    try {
      await orgsApi.delete(id);
      toast.deleted("Organization deleted");
      loadOrgs();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
    }
  }

  async function openHistory(org: any) {
    setHistoryOrg(org);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await orgsApi.getHistory(org.id);
      const historyList = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      const formatted = historyList.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        score: d.securityScore,
      }));
      setHistoryData(formatted);
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function deleteDomainItem(id: number) {
    if (!confirm("Remove this domain?")) return;
    try {
      await orgsApi.deleteDomain(id);
      toast.deleted("Asset deleted");
      loadAssets();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
    }
  }

  function openEditDomain(asset: any) {
    setEditingDomain(asset);
    setEditDomainForm({ domain: asset.domain, organizationName: asset.organization });
    setEditDomainOpen(true);
  }

  async function saveEditDomain() {
    if (!editingDomain) return;
    setSaving(true);
    try {
      await orgsApi.editDomain(editingDomain.id, editDomainForm);
      toast.success("Changes saved");
      setEditDomainOpen(false); setEditingDomain(null); loadAssets();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
    } finally { setSaving(false); }
  }

  // ── Sort handlers ─────────────────────────────────────────────────
  function handleOrgSort(field: string) {
    if (field === orgSortBy) { setOrgSortOrder((o) => o === "asc" ? "desc" : "asc"); }
    else { setOrgSortBy(field); setOrgSortOrder(field === "issues" ? "desc" : "asc"); }
    setPage(1);
  }
  function handleAssetSort(field: string) {
    if (field === assetSortBy) { setAssetSortOrder((o) => o === "asc" ? "desc" : "asc"); }
    else { setAssetSortBy(field); setAssetSortOrder(field === "issueCount" ? "desc" : "asc"); }
    setAssetPage(1);
  }

  // ── Filter helpers ────────────────────────────────────────────────
  function toggleFilter(group: keyof AssetFilters, value: string) {
    setPendingFilters((prev) => {
      const list = prev[group];
      return {
        ...prev,
        [group]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  function applyFilters() {
    setActiveFilters({ ...pendingFilters });
    setAssetPage(1);
    setFilterOpen(false);
  }

  function clearAllFilters() {
    setPendingFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setAssetPage(1);
    setFilterOpen(false);
  }

  function removeTag(group: keyof AssetFilters, value: string) {
    const updated = { ...activeFilters, [group]: activeFilters[group].filter((v) => v !== value) };
    setActiveFilters(updated);
    setPendingFilters(updated);
    setAssetPage(1);
  }

  const totalFilterCount =
    activeFilters.organizations.length + activeFilters.types.length + activeFilters.statuses.length;

  const orgItems: any[] = data?.items ?? [];
  const orgTotal: number = data?.total ?? 0;
  const assetItems: any[] = assetData?.items ?? [];
  const assetTotal: number = assetData?.total ?? 0;

  // VIEWER hides the Actions column entirely, so table colSpans shrink by one.
  const orgColSpan = canEdit ? 5 : 4;
  const assetColSpan = canEdit ? 6 : 5;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Total Organizations" value={orgTotal.toLocaleString()} icon={Building2} loading={loading} />
        <KpiCard title="Total Assets" value={assetData?.kpis?.total?.toLocaleString() ?? "—"} icon={Building2} color="blue" loading={assetLoading} />
        <div
          className="cursor-pointer hover:ring-2 hover:ring-orange-300 rounded-xl transition-all"
          onClick={() => router.push("/assets?orgAssignment=unassigned")}
        >
          <KpiCard
            title="Unassigned Assets"
            value={stats?.unassignedAssets?.toLocaleString() ?? "—"}
            sub="Not yet assigned"
            icon={AlertTriangle}
            color="orange"
            loading={statsLoading}
          />
        </div>
      </div>

      {/* Org toolbar */}
      <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="input pl-9 w-64" placeholder="Search organizations..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button className="btn-secondary text-red-600 border-red-200 hover:bg-red-50" onClick={handleCleanup} disabled={saving}><Trash2 className="w-4 h-4" /> Clean Up Garbage</button>
            <button className="btn-secondary" onClick={() => setBulkOpen(true)}><Upload className="w-4 h-4" /> Bulk Upload</button>
            <button className="btn-secondary" onClick={() => setAddDomainOpen(true)}><Plus className="w-4 h-4" /> Add Asset</button>
            <button className="btn-primary" onClick={() => setAddOrgOpen(true)}><Plus className="w-4 h-4" /> Add Organization</button>
          </div>
        )}
      </div>

      {/* Org table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                <SortableHeader label="Organization" field="name"    currentSort={orgSortBy} currentOrder={orgSortOrder} onSort={handleOrgSort} />
                <SortableHeader label="Domains"      field="domains" currentSort={orgSortBy} currentOrder={orgSortOrder} onSort={handleOrgSort} />
                <SortableHeader label="Issues"       field="issues"  currentSort={orgSortBy} currentOrder={orgSortOrder} onSort={handleOrgSort} />
                <SortableHeader label="Score"        field="score"   currentSort={orgSortBy} currentOrder={orgSortOrder} onSort={handleOrgSort} />
                {canEdit && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={orgColSpan} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" /></td></tr>
                ))
              ) : orgItems.length === 0 ? (
                <tr><td colSpan={orgColSpan} className="text-center py-12 text-gray-400 dark:text-slate-500">No organizations found</td></tr>
              ) : (
                orgItems.map((org: any) => (
                  <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{org.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{org._count.domains}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{org._count.issues}</td>
                    <td className="px-4 py-3 flex items-center justify-between group/row">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        org.securityScore >= 90 ? "bg-green-100 text-green-800" :
                        org.securityScore >= 80 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {org.securityScore}
                      </span>
                      <button
                        onClick={() => openHistory(org)}
                        className="p-1 ml-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="View Score History"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteOrg(org.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 border-t border-gray-100">
          <Pagination page={page} pageSize={ORG_PAGE_SIZE} total={orgTotal} onChange={setPage} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Asset Explorer
      ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-semibold text-gray-800 px-0.5">Asset Explorer</h2>

        {/* Search + Filter bar */}
        <div className="card p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9 w-full"
              placeholder="Search by organization or asset/domain..."
              value={assetSearch}
              onChange={(e) => { setAssetSearch(e.target.value); setAssetPage(1); }}
            />
          </div>

          {/* Export */}
          <div className="relative" ref={exportRef}>
            <button className="btn-secondary flex items-center gap-1.5" onClick={() => setExportOpen((o) => !o)}>
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1">
                <button onClick={() => handleExport("full")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Export Full Table
                </button>
                <button onClick={() => handleExport("mapping")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Export URL + Org Mapping
                </button>
              </div>
            )}
          </div>

          {/* Filter button + popover */}
          <div className="relative" ref={filterRef}>
            <button
              className="btn-secondary flex items-center gap-1.5"
              onClick={() => {
                setPendingFilters({ ...activeFilters });
                setFilterOpen((o) => !o);
              }}
            >
              <Filter className="w-4 h-4" />
              {totalFilterCount > 0 ? `Filter (${totalFilterCount})` : "Filter"}
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl z-50">
                <div className="p-4 space-y-5 max-h-[420px] overflow-y-auto">

                  {/* Organization group */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Organization</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {allOrgs.length === 0 && (
                        <p className="text-xs text-gray-400">Loading…</p>
                      )}
                      {allOrgs.map((org) => (
                        <label key={org} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={pendingFilters.organizations.includes(org)}
                            onChange={() => toggleFilter("organizations", org)}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-700 truncate group-hover:text-gray-900">{org}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Type group */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</p>
                    <div className="space-y-1.5">
                      {ASSET_TYPE_OPTIONS.map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={pendingFilters.types.includes(value)}
                            onChange={() => toggleFilter("types", value)}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status group */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
                    <div className="space-y-1.5">
                      {["Vulnerable", "Healthy"].map((s) => (
                        <label key={s} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={pendingFilters.statuses.includes(s)}
                            onChange={() => toggleFilter("statuses", s)}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Panel footer */}
                <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                  <button
                    className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </button>
                  <button className="btn-primary text-sm py-1.5 px-4" onClick={applyFilters}>
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active filter tags */}
        {totalFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 px-0.5">
            {activeFilters.organizations.map((org) => (
              <span key={`org-${org}`}
                className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                Org: {org}
                <button onClick={() => removeTag("organizations", org)}
                  className="p-0.5 hover:bg-blue-100 rounded-full transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {activeFilters.types.map((t) => (
              <span key={`type-${t}`}
                className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">
                Type: {ASSET_TYPE_DISPLAY[t]?.label ?? t}
                <button onClick={() => removeTag("types", t)}
                  className="p-0.5 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-full transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {activeFilters.statuses.map((s) => (
              <span key={`status-${s}`}
                className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs rounded-full font-medium">
                Status: {s}
                <button onClick={() => removeTag("statuses", s)}
                  className="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Asset table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                  <SortableHeader label="Asset"        field="domain"       currentSort={assetSortBy} currentOrder={assetSortOrder} onSort={handleAssetSort} />
                  <SortableHeader label="Type"         field="type"         currentSort={assetSortBy} currentOrder={assetSortOrder} onSort={handleAssetSort} />
                  <SortableHeader label="Organization" field="organization" currentSort={assetSortBy} currentOrder={assetSortOrder} onSort={handleAssetSort} />
                  <SortableHeader label="Status"       field="status"       currentSort={assetSortBy} currentOrder={assetSortOrder} onSort={handleAssetSort} />
                  <SortableHeader label="Issues"       field="issueCount"   currentSort={assetSortBy} currentOrder={assetSortOrder} onSort={handleAssetSort} align="right" />
                  {canEdit && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {assetLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={assetColSpan} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" /></td></tr>
                  ))
                ) : assetItems.length === 0 ? (
                  <tr><td colSpan={assetColSpan} className="text-center py-12 text-gray-400 dark:text-slate-500">No assets found</td></tr>
                ) : (
                  assetItems.map((asset: any) => (
                    <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100 max-w-xs truncate">{asset.domain}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const d = ASSET_TYPE_DISPLAY[asset.type];
                          return (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d?.style ?? "text-gray-600 bg-gray-100"}`}>
                              {d?.label ?? asset.type}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{asset.organization || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[asset.status] ?? "text-gray-600 bg-gray-100"}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {asset.issueCount > 0
                          ? <span className="text-red-600">{asset.issueCount}</span>
                          : <span className="text-gray-400">0</span>}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditDomain(asset)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteDomainItem(asset.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 border-t border-gray-100">
            <Pagination page={assetPage} pageSize={ASSET_PAGE_SIZE} total={assetTotal} onChange={setAssetPage} />
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}

      {/* Add Org */}
      <Modal open={addOrgOpen} title="Add Organization" onClose={() => setAddOrgOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Organization Name</label>
            <input className="input" placeholder="e.g. Faculty of Engineering" value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setAddOrgOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={createOrg} disabled={saving || !newOrgName.trim()}>
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Asset */}
      <Modal open={addDomainOpen} title="Add Asset / Domain" onClose={() => setAddDomainOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Organization Name</label>
            <OrgCombobox
              orgs={allOrgs}
              value={newDomain.name}
              onChange={(name) => setNewDomain((d) => ({ ...d, name }))}
              onCreate={createOrgInline}
              placeholder="Search or add an organization…"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Domain / URL</label>
            <input className="input" placeholder="e.g. eng.kku.ac.th" value={newDomain.domain}
              onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setAddDomainOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={createDomain} disabled={saving || !newDomain.name || !newDomain.domain}>
              {saving ? "Saving..." : "Add"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Asset */}
      <Modal open={editDomainOpen} title="Edit Asset" onClose={() => { setEditDomainOpen(false); setEditingDomain(null); }}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Domain / URL</label>
            <input className="input" placeholder="e.g. eng.kku.ac.th" value={editDomainForm.domain}
              onChange={(e) => setEditDomainForm({ ...editDomainForm, domain: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Organization</label>
            <select
              className="input"
              value={editDomainForm.organizationName}
              onChange={(e) => setEditDomainForm({ ...editDomainForm, organizationName: e.target.value })}
            >
              <option value="">— Select organization —</option>
              {allOrgs.map((org) => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => { setEditDomainOpen(false); setEditingDomain(null); }}>Cancel</button>
            <button className="btn-primary" onClick={saveEditDomain}
              disabled={saving || !editDomainForm.domain || !editDomainForm.organizationName}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload */}
      <Modal open={bulkOpen} title="Bulk Upload Mapping" onClose={() => { setBulkOpen(false); setMsg(""); }}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Upload a CSV with columns: <code className="bg-gray-100 px-1 rounded">orgname</code> and <code className="bg-gray-100 px-1 rounded">url</code>.</p>
          <input type="file" accept=".csv,.xlsx" className="input"
            onChange={(e) => setMappingFile(e.target.files?.[0] ?? null)} />
          {msg && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded">{msg}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => { setBulkOpen(false); setMsg(""); }}>Close</button>
            <button className="btn-primary" onClick={uploadBulk} disabled={saving || !mappingFile}>
              {saving ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal open={historyOpen} title={`${historyOrg?.name || "Organization"} - 30-Day Security Score History`} onClose={() => setHistoryOpen(false)}>
        <div className="space-y-4">
          {historyLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : historyData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <TrendingUp className="w-12 h-12 mb-2" />
              <p>No historical data available yet</p>
              <p className="text-xs">Data will accumulate during nightly scans</p>
            </div>
          ) : (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tickLine={false} style={{ fontSize: 12, fill: "#64748B" }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} style={{ fontSize: 12, fill: "#64748B" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "none",
                      borderRadius: "0.5rem",
                      color: "#F8FAFC",
                    }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button className="btn-secondary" onClick={() => setHistoryOpen(false)}>Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
