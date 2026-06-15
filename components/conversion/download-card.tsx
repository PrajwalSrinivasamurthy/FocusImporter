"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { OutputFile } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { AlertCircle, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface DownloadCardProps {
  jobId: string;
  file: OutputFile;
  index: number;
  locked: boolean;
  expired: boolean;
}

export function DownloadCard({ jobId, file, index, locked, expired }: DownloadCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await api.downloadFile(jobId, file.name);
      toast.success(`${file.name} downloaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  if (expired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + index * 0.08, duration: 0.3 }}
        className="surface flex w-full items-center gap-4 rounded-2xl px-5 py-4 opacity-50"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-500">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-medium text-strong">
            {file.name}
          </p>
          <p className="text-xs text-red-500">Session expired — re-upload to download</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.3 }}
      disabled={locked || downloading}
      onClick={handleDownload}
      className="group surface flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all hover:border-scarlet-600/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <FileSpreadsheet className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium text-strong">
          {file.name}
        </p>
        <p className="text-xs text-muted">{formatBytes(file.sizeBytes)}</p>
        <p className="text-xs text-muted">
          {file.rowCount.toLocaleString()} rows · {file.colCount} columns
        </p>
      </div>
      <div className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors group-hover:bg-scarlet-600 group-hover:text-white">
        <Download className="h-4 w-4" />
      </div>
    </motion.button>
  );
}
