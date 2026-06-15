import * as XLSX from "xlsx";
import type { ApiClient } from "@/lib/api/client";
import type {
  ConversionDetails,
  ConversionManifest,
  OutputFile,
  PushReceipt,
} from "@/lib/types";
import { buildStudentInfoCsv } from "@/lib/csv/student-info";
import { buildEnrollmentCsv } from "@/lib/csv/enrollment";
import { buildPrimaryAddressCsv } from "@/lib/csv/primary-address";

// ── In-browser job registry ───────────────────────────────────────────────────
// Keyed by jobId → filename → Blob. Cleared on each new conversion so memory
// does not accumulate across multiple runs in the same session.

interface JobFiles {
  [fileName: string]: Blob;
}

interface JobRegistry {
  [jobId: string]: JobFiles;
}

const _jobs: JobRegistry = {};

// ── Workbook parser ───────────────────────────────────────────────────────────

interface ParsedWorkbook {
  headers: string[];
  rawRows: unknown[][];
}

function parseWorkbook(buffer: ArrayBuffer): ParsedWorkbook {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const all = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
  });

  if (all.length === 0) return { headers: [], rawRows: [] };

  const headers = (all[0] as unknown[]).map((h) =>
    h === null || h === undefined ? "" : String(h),
  );
  const rawRows = all.slice(1) as unknown[][];

  return { headers, rawRows };
}

// ── Output file descriptor builder ────────────────────────────────────────────

function makeOutputFile(
  jobId: string,
  name: string,
  blob: Blob,
  rowCount: number,
  colCount: number,
): OutputFile {
  return {
    name,
    downloadUrl: `/local/${jobId}/${encodeURIComponent(name)}`,
    sizeBytes: blob.size,
    rowCount,
    colCount,
  };
}

// ── Client implementation ─────────────────────────────────────────────────────

export class LocalApiClient implements ApiClient {
  async convert(
    file: File,
    details: ConversionDetails,
    onStage?: (stage: number) => void,
  ): Promise<ConversionManifest> {
    // Clear previous jobs — only one active conversion at a time
    for (const id in _jobs) delete _jobs[id];

    onStage?.(0); // → Validate stage active

    const buffer = await file.arrayBuffer();
    const { headers, rawRows } = parseWorkbook(buffer);

    if (headers.length === 0) {
      throw new Error("The uploaded workbook appears to be empty.");
    }

    onStage?.(1); // → Split stage active

    const studentInfo   = buildStudentInfoCsv(headers, rawRows, details);
    const enrollment    = buildEnrollmentCsv(headers, rawRows, details);
    const primaryAddr   = buildPrimaryAddressCsv(headers, rawRows);

    onStage?.(2); // → Deliver stage active

    const jobId = crypto.randomUUID();
    _jobs[jobId] = {
      "Student Information.csv": studentInfo.csvBlob,
      "Enrollment.csv":          enrollment.csvBlob,
      "Primary Address.csv":     primaryAddr.csvBlob,
    };

    const outputFiles: OutputFile[] = [
      makeOutputFile(jobId, "Student Information.csv", studentInfo.csvBlob, studentInfo.rows.length, 18),
      makeOutputFile(jobId, "Enrollment.csv",          enrollment.csvBlob,  enrollment.rows.length,  7),
      makeOutputFile(jobId, "Primary Address.csv",     primaryAddr.csvBlob, primaryAddr.rows.length, 7),
    ];

    return {
      jobId,
      status: studentInfo.issues.length > 0 ? "completed_with_issues" : "completed",
      sourceFileName: file.name,
      createdAt: new Date().toISOString(),
      issues: studentInfo.issues,
      files: outputFiles,
    };
  }

  async downloadFile(jobId: string, fileName: string): Promise<void> {
    const blob = _jobs[jobId]?.[fileName];
    if (!blob) throw new Error("File not found or session has expired.");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async pushToFocus(_jobId: string, _ignoreIssues: boolean): Promise<PushReceipt> {
    throw new Error("Not applicable.");
  }
}
