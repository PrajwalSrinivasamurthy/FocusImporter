"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ValidationIssue } from "@/lib/types";
import { AlertTriangle, Check, ChevronDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface IssuesPanelProps {
  issues: ValidationIssue[];
  acknowledged: boolean;
  onAcknowledge: () => void;
}

export function IssuesPanel({
  issues,
  acknowledged,
  onAcknowledge,
}: IssuesPanelProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const copyCell = async (issue: ValidationIssue) => {
    await navigator.clipboard.writeText(issue.cell);
    toast.success(`Copied ${issue.cell}`);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5">
      <div className="flex items-center gap-3 border-b border-amber-500/20 px-5 py-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <div className="flex-1">
          <p className="font-display text-sm font-semibold text-strong">
            Issues found
          </p>
          <p className="text-xs text-muted">
            {issues.length} {issues.length === 1 ? "cell needs" : "cells need"}{" "}
            attention in the source workbook
          </p>
        </div>
        <Badge tone="amber">{issues.length}</Badge>
      </div>

      <ul className="divide-y divide-amber-500/10">
        {issues.map((issue) => {
          const open = openId === issue.id;
          return (
            <li key={issue.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : issue.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-amber-500/5"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-amber-600 transition-transform dark:text-amber-400",
                    open && "rotate-180"
                  )}
                />
                <span className="font-mono text-xs font-medium text-strong">
                  {issue.column}
                </span>
                <span className="text-xs text-muted">row {issue.row}</span>
                <span className="ml-auto text-xs text-muted">
                  {issue.type === "empty_row"
                    ? "empty row"
                    : issue.type === "invalid_value"
                    ? "invalid value"
                    : "empty cell"}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-12 pb-4">
                      <code className="rounded-md bg-black/5 px-2 py-1 font-mono text-xs text-strong dark:bg-white/10">
                        {issue.cell}
                      </code>
                      <p className="flex-1 text-xs text-muted">
                        {issue.message}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyCell(issue)}
                        aria-label={`Copy cell ${issue.cell}`}
                        className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-black/5 hover:text-strong dark:hover:bg-white/10"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-amber-500/20 px-5 py-4">
        {acknowledged ? (
          <p className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="h-4 w-4" /> Issues acknowledged — downloads
            unlocked below.
          </p>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted">
              Fix these in the source and re-upload, or continue as-is.
            </p>
            <Button variant="danger-outline" size="sm" onClick={onAcknowledge}>
              Ignore issues, download anyway
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
