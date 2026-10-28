import {
  buildHeaderIndex,
  csvEscape,
  getCell,
  asString,
  peopleImportKey,
  skipFormatHintRow,
  type HeaderIndex,
} from "@/lib/csv/utils";

import { getParentKey } from "@/lib/csv/parent-user-info";

// ── Output schema ─────────────────────────────────────────────────────────────

// All string: CSV is text, Staff ID stays blank until Focus SIS creates the
// Parent User ID in Step 4, and IDs keep any leading zeros.
export interface ParentLinkedUserRow {
  "Staff ID": string;
  "Student ID": string;
  "Person ID": string;
}

export const PARENT_LINKED_USER_HEADERS: ReadonlyArray<keyof ParentLinkedUserRow> = [
  "Staff ID",
  "Student ID",
  "Person ID",
] as const;

export interface ParentLinkedUserResult {
  csvBlob: Blob;
  rows: ParentLinkedUserRow[];
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapRow(studentId: string): ParentLinkedUserRow {
  return {
    // Parent User ID is created by Focus SIS after the Step 4 import
    "Staff ID": "",
    // TTU Local Student ID = External School ID / Student School ID
    "Student ID": studentId,
    // Same key as "People Import Key" in Student Contact (Step 3)
    "Person ID": peopleImportKey(studentId),
  };
}

function getStudentId(raw: unknown[], idx: HeaderIndex): string {
  return asString(
    getCell(raw, idx, "External School ID", "Student School ID", "TTU Local Student ID"),
  );
}

// ── CSV serialiser ────────────────────────────────────────────────────────────

function rowToCsvLine(row: ParentLinkedUserRow): string {
  return PARENT_LINKED_USER_HEADERS.map((h) => csvEscape(row[h])).join(",");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildParentLinkedUserCsv(
  headers: string[],
  rawRows: unknown[][],
): ParentLinkedUserResult {
  const idx = buildHeaderIndex(headers);
  const { dataRows } = skipFormatHintRow(rawRows);

  const mappedRows: ParentLinkedUserRow[] = [];
  const seenLinks = new Set<string>();

  for (const raw of dataRows) {
    if (raw.every((v) => v === null || v === undefined || String(v).trim() === "")) {
      continue;
    }

    // Same rule as Step 4: no parent email → no parent account to link to
    const parentKey = getParentKey(raw, idx);
    if (!parentKey) continue;

    const studentId = getStudentId(raw, idx);
    if (!studentId) continue;

    // One row per parent–student link: a parent with two students gets two rows
    const linkKey = `${parentKey}|${studentId}`;
    if (seenLinks.has(linkKey)) continue;
    seenLinks.add(linkKey);

    mappedRows.push(mapRow(studentId));
  }

  const csvLines = [
    PARENT_LINKED_USER_HEADERS.join(","),
    ...mappedRows.map(rowToCsvLine),
  ];

  const csvBlob = new Blob(["﻿" + csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });

  return { csvBlob, rows: mappedRows };
}
