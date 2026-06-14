import type { ConversionDetails } from "@/lib/types";
import {
  asGrade,
  asString,
  buildHeaderIndex,
  csvEscape,
  getCell,
  skipFormatHintRow,
  type HeaderIndex,
} from "@/lib/csv/utils";


// ── Output schema ─────────────────────────────────────────────────────────────

export interface EnrollmentRow {
  "External School ID": string;
  "Syear": string;
  "School ID": string;
  "Start Date": string;
  "End Date": string;
  "Grade": string;
  "Enrollment Code": string;
}

export const ENROLLMENT_HEADERS: ReadonlyArray<keyof EnrollmentRow> = [
  "External School ID",
  "Syear",
  "School ID",
  "Start Date",
  "End Date",
  "Grade",
  "Enrollment Code",
] as const;

export interface EnrollmentResult {
  csvBlob: Blob;
  rows: EnrollmentRow[];
}

// ── Value transformers ────────────────────────────────────────────────────────

// Output M/D/YYYY (no leading zeros) from the form's MM/DD/YYYY value.
function formatStartDate(mmddyyyy: string): string {
  const parts = mmddyyyy.split("/");
  if (parts.length !== 3) return mmddyyyy;
  const [mm, dd, yyyy] = parts;
  return `${parseInt(mm, 10)}/${parseInt(dd, 10)}/${yyyy}`;
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapRow(
  raw: unknown[],
  idx: HeaderIndex,
  details: ConversionDetails,
  startDate: string,
): EnrollmentRow {
  return {
    "External School ID": asString(
      getCell(raw, idx, "Student School ID", "External School ID"),
    ),
    "Syear": details.syear,
    "School ID": details.schoolId,
    "Start Date": startDate,
    "End Date": "",
    "Grade": asGrade(raw[7], true),
    "Enrollment Code": details.enrollmentCode,
  };
}

// ── CSV serialiser ────────────────────────────────────────────────────────────

function rowToCsvLine(row: EnrollmentRow): string {
  return ENROLLMENT_HEADERS.map((h) => csvEscape(row[h])).join(",");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildEnrollmentCsv(
  headers: string[],
  rawRows: unknown[][],
  details: ConversionDetails,
): EnrollmentResult {
  const idx = buildHeaderIndex(headers);
  const { dataRows } = skipFormatHintRow(rawRows);
  const startDate = formatStartDate(details.startDate);

  const mappedRows: EnrollmentRow[] = [];

  for (const raw of dataRows) {
    // Skip entirely blank rows
    if (raw.every((v) => v === null || v === undefined || String(v).trim() === "")) {
      continue;
    }
    mappedRows.push(mapRow(raw, idx, details, startDate));
  }

  const csvLines = [
    ENROLLMENT_HEADERS.join(","),
    ...mappedRows.map(rowToCsvLine),
  ];

  const csvBlob = new Blob(["﻿" + csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });

  return { csvBlob, rows: mappedRows };
}
