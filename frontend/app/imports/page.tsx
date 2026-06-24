"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, RefreshCw, Trash2, Download, AlertCircle, ArrowLeftRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";
import { importsApi } from "@/lib/api";
import { useSnapshot } from "@/lib/snapshotContext";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/me";

const IN_PROGRESS = ["pending", "processing"];
const TERMINAL = ["success", "completed", "failed"];

const PAGE_SIZE = 20;
const SOURCE_LABEL: Record<string, string> = {
  file: "File Import",
  manualFetch: "Manual Fetch",
  cronAutoFetch: "Cron Fetch",
};

export default function ImportsPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | string | null>(null);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [snapshotDate, setSnapshotDate] = useState("");
  const [note, setNote] = useState("");

  // Replace modal
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<any>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceConfirm, setReplaceConfirm] = useState<{ conflictDate: string; newImportId: number } | null>(null);
  const [replaceError, setReplaceError] = useState("");

  const canEdit = useCanEdit();

  // Toast + background-job polling
  const toast = useToast();
  const { refresh: refreshSnapshots } = useSnapshot();
  const pollers = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await importsApi.list({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, status: statusFilter || undefined, sortBy, sortOrder });
      setData(r);
    } finally { setLoading(false); }
  }, [page, statusFilter, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  // Keep the latest load/refresh accessible from long-lived poll intervals.
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);
  const refreshRef = useRef(refreshSnapshots);
  useEffect(() => { refreshRef.current = refreshSnapshots; }, [refreshSnapshots]);

  const stopPolling = useCallback((id: number) => {
    const t = pollers.current.get(id);
    if (t) { clearInterval(t); pollers.current.delete(id); }
  }, []);

  // Poll a single import's status every 3s until it reaches a terminal state.
  const startPolling = useCallback((id: number) => {
    if (pollers.current.has(id)) return;
    const t = setInterval(async () => {
      try {
        const r = await importsApi.getStatus(id);
        const st = String(r.status);
        if (TERMINAL.includes(st)) {
          stopPolling(id);
          await loadRef.current();
          if (st === "failed") {
            toast.error(`Import #${id} failed${r.error ? ": " + r.error : ""}`);
          } else {
            toast.success(`Import #${id} complete (${(r.totalIssues ?? 0).toLocaleString()} records)`);
            refreshRef.current(); // pull the new snapshot into context → banner on other pages
          }
        }
      } catch {
        stopPolling(id);
      }
    }, 3000);
    pollers.current.set(id, t);
  }, [stopPolling, toast]);

  // Auto-poll any rows that are still in progress (incl. ones loaded fresh).
  useEffect(() => {
    (data?.items ?? []).forEach((imp: any) => {
      if (IN_PROGRESS.includes(imp.status)) startPolling(imp.id);
    });
  }, [data, startPolling]);

  // Clear all intervals on unmount.
  useEffect(() => {
    const map = pollers.current;
    return () => { map.forEach((t) => clearInterval(t)); map.clear(); };
  }, []);

  async function doUpload() {
    if (!uploadFile) return;
    setBusy("upload");
    setError("");
    try {
      const res = await importsApi.upload(uploadFile, { snapshotDate, note });
      setUploadOpen(false); setUploadFile(null); setSnapshotDate(""); setNote("");
      toast.success("Upload complete — processing…");
      await load();
      if (res?.importId) startPolling(res.importId);
    } catch (e: any) {
      setError(e.response?.data?.error ?? e.message);
    } finally { setBusy(null); }
  }

  async function doFetch() {
    setBusy("fetch");
    setError("");
    try {
      const res = await importsApi.fetchFromApi();
      toast.success("Fetch started — processing…");
      await load();
      if (res?.importId) startPolling(res.importId);
    } catch (e: any) { setError(e.response?.data?.error ?? e.message); }
    finally { setBusy(null); }
  }

  async function doReprocess(id: number) {
    setBusy(id);
    try {
      await importsApi.reprocess(id);
      await load();
      startPolling(id);
    } catch (e: any) { setError(e.response?.data?.error ?? e.message); }
    finally { setBusy(null); }
  }

  async function doDownload(imp: any) {
    setBusy(`dl-${imp.id}`);
    try {
      const res = await importsApi.download(imp.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = imp.fileName ?? `import-${imp.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.response?.data?.error ?? e.message);
    } finally { setBusy(null); }
  }

  async function doDelete(id: number) {
    if (!confirm("Delete this import and all its issues?")) return;
    setBusy(id);
    try {
      await importsApi.delete(id);
      toast.deleted(`Import #${id} deleted`);
      load();
    }
    catch (e: any) { toast.error(e.response?.data?.error ?? e.message); }
    finally { setBusy(null); }
  }

  function openReplace(imp: any) {
    setReplaceTarget(imp);
    setReplaceFile(null);
    setReplaceConfirm(null);
    setReplaceError("");
    setReplaceOpen(true);
  }

  async function doReplace() {
    if (!replaceTarget) return;
    setBusy("replace");
    setReplaceError("");
    try {
      const res = await importsApi.replace(
        { originalImportId: replaceTarget.id },
        replaceFile ?? undefined,
      );
      if (res.requiresConfirmation) {
        setReplaceConfirm({ conflictDate: res.conflictDate, newImportId: res.newImportId });
      } else {
        setReplaceOpen(false);
        toast.success("Replace complete — processing…");
        await load();
        if (res.importId) startPolling(res.importId);
      }
    } catch (e: any) {
      setReplaceError(e.response?.data?.error ?? e.message);
    } finally { setBusy(null); }
  }

  async function doReplaceConfirm() {
    if (!replaceTarget || !replaceConfirm) return;
    setBusy("replace-confirm");
    setReplaceError("");
    try {
      const res = await importsApi.replace({
        originalImportId: replaceTarget.id,
        newImportId: replaceConfirm.newImportId,
        confirm: true,
      });
      setReplaceOpen(false);
      setReplaceConfirm(null);
      toast.success("Replace complete — processing…");
      await load();
      if (res.importId) startPolling(res.importId);
    } catch (e: any) {
      setReplaceError(e.response?.data?.error ?? e.message);
    } finally { setBusy(null); }
  }

  function handleSort(field: string) {
    if (field === sortBy) { setSortOrder((o) => o === "asc" ? "desc" : "asc"); }
    else { setSortBy(field); setSortOrder(field === "totalIssues" || field === "uploadedAt" || field === "snapshotDate" ? "desc" : "asc"); }
    setPage(1);
  }

  const items: any[] = data?.items ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <select className="input w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={doFetch} disabled={busy === "fetch"}>
            <Download className="w-4 h-4" />
            {busy === "fetch" ? "Fetching..." : "Fetch from API"}
          </button>
          <button className="btn-primary" onClick={() => setUploadOpen(true)}>
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">No.</th>
                <SortableHeader label="User"          field="user"         currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="File Name"     field="fileName"     currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Records"       field="totalIssues"  currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} align="right" />
                <SortableHeader label="Import Type"   field="source"       currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Snapshot Date" field="snapshotDate" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Uploaded At"   field="uploadedAt"   currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Status"        field="status"       currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No imports found</td></tr>
              ) : (
                items.map((imp: any, i: number) => {
                  const inProgress = IN_PROGRESS.includes(imp.status);
                  return (
                  <tr key={imp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {imp.uploadedBy ? `${imp.uploadedBy.firstName ?? ""} ${imp.uploadedBy.lastName ?? ""}`.trim() || imp.uploadedBy.email : "System"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate text-xs">{imp.fileName ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">{imp.totalIssues?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{SOURCE_LABEL[imp.source] ?? imp.source}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {imp.snapshotDate ? new Date(imp.snapshotDate).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(imp.uploadedAt ?? imp.createdAt).toLocaleString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={imp.status} />
                        {inProgress && <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => doDownload(imp)} disabled={busy === `dl-${imp.id}`}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Download CSV">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => doReprocess(imp.id)} disabled={busy === imp.id || inProgress}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-40" title="Reprocess">
                          <RefreshCw className={`w-4 h-4 ${busy === imp.id || inProgress ? "animate-spin" : ""}`} />
                        </button>
                        {canEdit && (
                          <button onClick={() => openReplace(imp)} disabled={busy === imp.id || inProgress || imp.status === "replaced"}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded disabled:opacity-40" title="Replace">
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => doDelete(imp.id)} disabled={busy === imp.id || inProgress}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-40" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 border-t border-gray-100">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>
      </div>

      {/* Upload Modal */}
      <Modal open={uploadOpen} title="Upload CSV File" onClose={() => setUploadOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">SecurityScorecard CSV *</label>
            <input type="file" accept=".csv" className="input"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Snapshot Date</label>
            <input type="date" className="input" value={snapshotDate} onChange={(e) => setSnapshotDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Note</label>
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setUploadOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={doUpload} disabled={busy === "upload" || !uploadFile}>
              {busy === "upload" ? "Uploading..." : "Upload & Process"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Replace Modal */}
      <Modal
        open={replaceOpen}
        title="Replace Import"
        onClose={() => { setReplaceOpen(false); setReplaceConfirm(null); }}
      >
        {replaceConfirm ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Replace data for date{" "}
              <strong>
                {replaceConfirm.conflictDate
                  ? new Date(replaceConfirm.conflictDate).toLocaleDateString("en-GB")
                  : "—"}
              </strong>
              ?
            </p>
            <p className="text-xs text-red-600">All existing data will be deleted and replaced by the new file</p>
            {replaceError && <p className="text-sm text-red-600">{replaceError}</p>}
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setReplaceConfirm(null)}>Cancel</button>
              <button className="btn-primary" onClick={doReplaceConfirm} disabled={busy === "replace-confirm"}>
                {busy === "replace-confirm" ? "Processing..." : "Confirm Replace"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Replace import #{replaceTarget?.id}{" "}
              {replaceTarget?.snapshotDate
                ? `(${new Date(replaceTarget.snapshotDate).toLocaleDateString("en-GB")})`
                : ""}
            </p>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Upload new file</label>
              <input
                type="file"
                accept=".csv"
                className="input"
                onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {replaceError && <p className="text-sm text-red-600">{replaceError}</p>}
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setReplaceOpen(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={doReplace}
                disabled={busy === "replace" || !replaceFile}
              >
                {busy === "replace" ? "Processing..." : "Replace"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
