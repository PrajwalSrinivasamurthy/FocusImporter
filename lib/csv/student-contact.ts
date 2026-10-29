import {
  asPhone,
  asString,
  buildHeaderIndex,
  csvEscape,
  getCell,
  getStudentId,
  peopleImportKey,
  skipFormatHintRow,
  type HeaderIndex,
} from "@/lib/csv/utils";

// ── Output schema ─────────────────────────────────────────────────────────────

export interface StudentContactRow {
  "Address": string;
  "Address 2": string;
  "City": string;
  "State": string;
  "Postal Zip Code": string;
  "Phone Number": string;
  "Contact First Name": string;
  "Contact Middle Name": string;
  "Contact Last Name": string;
  "Contact Email": string;
  "Student ID": string;
  "People Import Key": string;
}

export const STUDENT_CONTACT_HEADERS: ReadonlyArray<keyof StudentContactRow> = [
  "Address",
  "Address 2",
  "City",
  "State",
  "Postal Zip Code",
  "Phone Number",
  "Contact First Name",
  "Contact Middle Name",
  "Contact Last Name",
  "Contact Email",
  "Student ID",
  "People Import Key",
] as const;

export interface StudentContactResult {
  csvBlob: Blob;
  rows: StudentContactRow[];
}

// ── Value transformers ────────────────────────────────────────────────────────

// Zip codes stored as Excel numbers lose leading zeros (07101 → 7101).
// Pad back to at least 5 digits for standard US zips; longer values are
// left as-is (handles ZIP+4 stored as text like "07101-1234").
function asZip(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "number") {
    const s = String(Math.round(val));
    return s.length < 5 ? s.padStart(5, "0") : s;
  }
  return String(val).trim();
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapRow(raw: unknown[], idx: HeaderIndex): StudentContactRow {
  return {
    "Address":             asString(getCell(raw, idx, "Address")),
    "Address 2":           asString(getCell(raw, idx, "Address 2")),
    "City":                asString(getCell(raw, idx, "City")),
    "State":               asString(getCell(raw, idx, "State")),
    "Postal Zip Code":     asZip(getCell(raw, idx, "Postal Zip Code")),
    "Phone Number":        asPhone(getCell(raw, idx, "Phone Number")),
    // Parent/guardian columns in the input template are the second "First/Middle/Last Name"
    "Contact First Name":  asString(getCell(raw, idx, "First Name.1")),
    "Contact Middle Name": asString(getCell(raw, idx, "Middle Name.1")),
    "Contact Last Name":   asString(getCell(raw, idx, "Last Name.1")),
    "Contact Email":       asString(getCell(raw, idx, "Parent Email")),
    // Student ID = TTU Local Student ID (same source as the other CSVs)
    "Student ID": getStudentId(raw, idx),
    // People Import Key = matching key hashed from TTU Local Student ID
    "People Import Key": peopleImportKey(getStudentId(raw, idx)),
  };
}

// ── CSV serialiser ────────────────────────────────────────────────────────────

function rowToCsvLine(row: StudentContactRow): string {
  return STUDENT_CONTACT_HEADERS.map((h) => csvEscape(row[h])).join(",");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildStudentContactCsv(
  headers: string[],
  rawRows: unknown[][],
): StudentContactResult {
  const idx = buildHeaderIndex(headers);
  const { dataRows } = skipFormatHintRow(rawRows);

  const mappedRows: StudentContactRow[] = [];

  for (const raw of dataRows) {
    if (raw.every((v) => v === null || v === undefined || String(v).trim() === "")) {
      continue;
    }
    // No student ID → the row can't be matched in Focus, so skip it (same rule in every CSV)
    if (!getStudentId(raw, idx)) continue;
    mappedRows.push(mapRow(raw, idx));
  }

  const csvLines = [
    STUDENT_CONTACT_HEADERS.join(","),
    ...mappedRows.map(rowToCsvLine),
  ];

  const csvBlob = new Blob(["﻿" + csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });

  return { csvBlob, rows: mappedRows };
}
