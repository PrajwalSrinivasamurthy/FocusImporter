"use client";

import { useEffect } from "react";
import { useJobStore } from "@/lib/job-store";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ScrollText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth-guard";

export default function HistoryPage() {
  const history  = useJobStore((s) => s.history);
  const loading  = useJobStore((s) => s.loading);
  const fetchHistory = useJobStore((s) => s.fetchHistory);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const exportCsv = () => {
    const header = "timestamp,source_file,output_files,issue_count,issues_overridden,status";
    const rows = history.map((h) =>
      [
        h.createdAt,
        `"${h.sourceFileName}"`,
        `"${h.outputFiles}"`,
        h.issueCount,
        h.issuesOverridden ? "1" : "0",
        h.status,
      ].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversion-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("History exported");
  };

  return (
    <AuthGuard>
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-scarlet-600 dark:text-scarlet-400">
            History
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-strong">
            Every conversion, on record.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Names and metadata only — the files themselves are never kept,
            so there is nothing here to re-download.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={exportCsv}
          disabled={history.length === 0 || loading}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </header>

      {loading ? (
        <Card className="flex flex-col items-center gap-4 px-8 py-14 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
          <p className="text-sm text-muted">Loading history…</p>
        </Card>
      ) : history.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 px-8 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black/5 text-ink-faint dark:bg-white/5 dark:text-zinc-500">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-strong">
              No conversions yet
            </p>
            <p className="mt-1 text-sm text-muted">
              The log starts with your first converted workbook.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-line text-left dark:border-night-line">
                {["When", "Uploaded file", "Output files", "Issues", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 font-display text-[11px] font-semibold uppercase tracking-widest text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line dark:divide-night-line">
              {history.map((h) => (
                <tr key={h.jobId} className="animate-rise-in">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-muted">
                    {formatTime(h.createdAt)}
                  </td>
                  <td className="max-w-44 truncate px-5 py-3 font-mono text-xs text-strong">
                    {h.sourceFileName}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">
                    {h.outputFiles.split(";").join(" · ")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {h.issueCount > 0 ? (
                        <Badge tone="amber">{h.issueCount}</Badge>
                      ) : (
                        <Badge tone="green">0</Badge>
                      )}
                      {h.issuesOverridden && (
                        <Badge tone="amber">overridden</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={h.status === "completed" ? "green" : "amber"}>
                      {h.status === "completed" ? "completed" : "with issues"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
    </AuthGuard>
  );
}
