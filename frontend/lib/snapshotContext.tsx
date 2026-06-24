"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { snapshotsApi } from "@/lib/api";

export interface SnapshotOption {
  id: number;
  snapshotDate: string;
  totalIssues: number;
}

interface SnapshotCtx {
  selectedSnapshotId: number | null;
  selectedSnapshot: SnapshotOption | null;
  snapshots: SnapshotOption[];
  loading: boolean;
  /** True when a refresh discovered a snapshot that wasn't there before. */
  hasNewData: boolean;
  setSelectedSnapshotId: (id: number) => void;
  /** Re-fetch the snapshot list; flags hasNewData if a new snapshot appeared. */
  refresh: () => Promise<void>;
  /** Switch to the newest snapshot and clear the new-data flag. */
  applyNewData: () => void;
  dismissNewData: () => void;
}

const SnapshotContext = createContext<SnapshotCtx>({
  selectedSnapshotId: null,
  selectedSnapshot: null,
  snapshots: [],
  loading: true,
  hasNewData: false,
  setSelectedSnapshotId: () => {},
  refresh: async () => {},
  applyNewData: () => {},
  dismissNewData: () => {},
});

export function SnapshotProvider({ children }: { children: React.ReactNode }) {
  const [snapshots, setSnapshots] = useState<SnapshotOption[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNewData, setHasNewData] = useState(false);
  const knownIds = useRef<Set<number>>(new Set());

  const loadList = useCallback(async (detectNew = false) => {
    try {
      const r = await snapshotsApi.list();
      const list: SnapshotOption[] = r.data ?? [];
      // Only flag "new data" when we already had snapshots and a new id appears.
      if (detectNew && knownIds.current.size > 0 && list.some((s) => !knownIds.current.has(s.id))) {
        setHasNewData(true);
      }
      knownIds.current = new Set(list.map((s) => s.id));
      setSnapshots(list);
      setSelectedSnapshotId((cur) => (cur == null && list.length ? list[0].id : cur));
    } catch {
      /* ignore — leave previous state intact */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(false); }, [loadList]);

  const refresh = useCallback(() => loadList(true), [loadList]);

  const applyNewData = useCallback(() => {
    setHasNewData(false);
    if (knownIds.current.size > 0) setSelectedSnapshotId(Math.max(...knownIds.current));
  }, []);

  const dismissNewData = useCallback(() => setHasNewData(false), []);

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId) ?? null;

  return (
    <SnapshotContext.Provider
      value={{
        selectedSnapshotId,
        selectedSnapshot,
        snapshots,
        loading,
        hasNewData,
        setSelectedSnapshotId,
        refresh,
        applyNewData,
        dismissNewData,
      }}
    >
      {children}
    </SnapshotContext.Provider>
  );
}

export function useSnapshot() {
  return useContext(SnapshotContext);
}
