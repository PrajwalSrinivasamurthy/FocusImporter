"use client";

import { create } from "zustand";
import type { ConversionManifest, HistoryRecord } from "@/lib/types";

interface JobState {
  history: HistoryRecord[];
  loading: boolean;
  /** Load records from the DB — call once on history page mount. */
  fetchHistory: () => Promise<void>;
  /** Optimistically prepend and persist to the DB. */
  addJob: (manifest: ConversionManifest) => void;
  /** Optimistically flip the flag and persist to the DB. */
  markIssuesOverridden: (jobId: string) => void;
}

export const useJobStore = create<JobState>((set) => ({
  history: [],
  loading: false,

  fetchHistory: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("fetch failed");
      const records: HistoryRecord[] = await res.json();
      set({ history: records });
    } catch {
      // Keep whatever is already in state; page shows stale data rather than crashing.
    } finally {
      set({ loading: false });
    }
  },

  addJob: (manifest) => {
    const record: HistoryRecord = {
      jobId:            manifest.jobId,
      createdAt:        manifest.createdAt,
      sourceFileName:   manifest.sourceFileName,
      outputFiles:      manifest.files.map((f) => f.name).join(";"),
      issueCount:       manifest.issues.length,
      issuesOverridden: false,
      status:           manifest.status,
    };

    // Optimistic update — UI reflects the new record instantly.
    set((s) => ({ history: [record, ...s.history] }));

    // Fire-and-forget persist; a failed write won't block the user.
    fetch("/api/history", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId:       record.jobId,
        sourceFile:  record.sourceFileName,
        outputFiles: record.outputFiles,
        issueCount:  record.issueCount,
        status:      record.status,
      }),
    }).catch((err) => console.error("[job-store] failed to persist history:", err));
  },

  markIssuesOverridden: (jobId) => {
    // Optimistic update.
    set((s) => ({
      history: s.history.map((h) =>
        h.jobId === jobId ? { ...h, issuesOverridden: true } : h,
      ),
    }));

    fetch(`/api/history/${encodeURIComponent(jobId)}`, { method: "PATCH" })
      .catch((err) => console.error("[job-store] failed to mark overridden:", err));
  },
}));
