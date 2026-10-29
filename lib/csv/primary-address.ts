import {
  asPhone,
  asString,
  buildHeaderIndex,
  csvEscape,
  getCell,
  getStudentId,
  skipFormatHintRow,
  type HeaderIndex,
} from "@/lib/csv/utils";

// ── Output schema ─────────────────────────────────────────────────────────────

export interface PrimaryAddressRow {
  "External School ID": string;
  "Address": string;
  "Address 2": string;
  "City": string;
  "State": string;
  "Postal Zip Code": string;
  "Phone Number": string;
}

export const PRIMARY_ADDRESS_HEADERS: ReadonlyArray<keyof PrimaryAddressRow> = [
  "External School ID",
  "Address",
  "Address 2",
  "City",
  "State",
  "Postal Zip Code",
  "Phone Number",
] as const;

export interface PrimaryAddressResult {
  csvBlob: Blob;
  rows: PrimaryAddressRow[];
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

function mapRow(raw: unknown[], idx: HeaderIndex): PrimaryAddressRow {
  return {
    "External School ID": getStudentId(raw, idx),
    "Address":          asString(getCell(raw, idx, "Address")),
    "Address 2":        asString(getCell(raw, idx, "Address 2")),
    "City":             asString(getCell(raw, idx, "City")),
    "State":            asString(getCell(raw, idx, "State")),
    "Postal Zip Code":  asZip(getCell(raw, idx, "Postal Zip Code")),
    "Phone Number":     asPhone(getCell(raw, idx, "Phone Number")),
  };
}

// ── CSV serialiser ────────────────────────────────────────────────────────────

function rowToCsvLine(row: PrimaryAddressRow): string {
  return PRIMARY_ADDRESS_HEADERS.map((h) => csvEscape(row[h])).join(",");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildPrimaryAddressCsv(
  headers: string[],
  rawRows: unknown[][],
): PrimaryAddressResult {
  const idx = buildHeaderIndex(headers);
  const { dataRows } = skipFormatHintRow(rawRows);

  const mappedRows: PrimaryAddressRow[] = [];

  for (const raw of dataRows) {
    if (raw.every((v) => v === null || v === undefined || String(v).trim() === "")) {
      continue;
    }
    // No student ID → the row can't be matched in Focus, so skip it (same rule in every CSV)
    if (!getStudentId(raw, idx)) continue;
    mappedRows.push(mapRow(raw, idx));
  }

  const csvLines = [
    PRIMARY_ADDRESS_HEADERS.join(","),
    ...mappedRows.map(rowToCsvLine),
  ];

  const csvBlob = new Blob(["﻿" + csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });

  return { csvBlob, rows: mappedRows };
}
