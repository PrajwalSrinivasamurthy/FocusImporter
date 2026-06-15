"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { cn, formatBytes } from "@/lib/utils";
import { FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { readWorkbookStats, type WorkbookStats } from "@/lib/workbook";

const MAX_BYTES = 10 * 1024 * 1024;

interface UploadDropzoneProps {
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}

export function UploadDropzone({
  file,
  onFile,
  disabled,
}: UploadDropzoneProps) {
  const [stats, setStats] = useState<WorkbookStats | null>(null);
  const [parsingStats, setParsingStats] = useState(false);

  useEffect(() => {
    if (!file) {
      setStats(null);
      return;
    }
    setParsingStats(true);
    readWorkbookStats(file)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setParsingStats(false));
  }, [file]);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length) {
        const code = rejected[0].errors[0]?.code;
        toast.error(
          code === "file-too-large"
            ? "That file is over the 10 MB limit."
            : "Only .xlsx workbooks are accepted."
        );
        return;
      }
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_BYTES,
    multiple: false,
    noClick: !!file,
    disabled,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-2xl border-2 border-dashed p-10 text-center transition-colors duration-200",
        isDragActive
          ? "border-scarlet-600 bg-scarlet-600/5"
          : "border-paper-line bg-paper-raised/60 dark:border-night-line dark:bg-night-raised/60",
        !file && "cursor-pointer hover:border-scarlet-600/50"
      )}
    >
      <input {...getInputProps()} aria-label="Upload Excel workbook" />

      {!file ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <div
            className={cn(
              "grid h-14 w-14 place-items-center rounded-2xl transition-colors",
              isDragActive
                ? "bg-scarlet-600 text-white"
                : "bg-scarlet-600/10 text-scarlet-700 dark:text-scarlet-400"
            )}
          >
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-strong">
              {isDragActive ? "Drop it here" : "Drop a student workbook"}
            </p>
            <p className="mt-1 text-sm text-muted">
              or click to browse · .xlsx only · 10 MB max
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 py-2">
          <FileSpreadsheet className="h-8 w-8 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate font-mono text-sm font-medium text-strong">
              {file.name}
            </p>
            <p className="text-xs text-muted">
              {formatBytes(file.size)}
              {parsingStats && (
                <span className="ml-2 opacity-50">reading…</span>
              )}
              {!parsingStats && stats && (
                <span className="ml-2">
                  · {stats.rowCount.toLocaleString()} rows · {stats.colCount} columns
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            aria-label="Remove file"
            onClick={(e) => {
              e.stopPropagation();
              onFile(null);
            }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-black/5 hover:text-strong dark:hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
