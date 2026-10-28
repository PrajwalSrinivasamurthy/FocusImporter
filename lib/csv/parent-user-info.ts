import type { ConversionDetails } from "@/lib/types";
import {
  asString,
  buildHeaderIndex,
  csvEscape,
  getCell,
  norm,
  skipFormatHintRow,
  type HeaderIndex,
} from "@/lib/csv/utils";

// ── Output schema ─────────────────────────────────────────────────────────────

export interface ParentUserInfoRow {
  "Contact Relationship": string;
  "Contact First Name": string;
  "Contact Middle Name": string;
  "Contact Last Name": string;
  "Contact Email": string;
  "Contact Cell Phone": string;
  "TTU Local Student ID": string;
  "Profile ID": string;
  "Username": string;
}

export const PARENT_USER_INFO_HEADERS: ReadonlyArray<keyof ParentUserInfoRow> = [
  "Contact Relationship",
  "Contact First Name",
  "Contact Middle Name",
  "Contact Last Name",
  "Contact Email",
  "Contact Cell Phone",
  "TTU Local Student ID",
  "Profile ID",
  "Username",
] as const;

export interface ParentUserInfoResult {
  csvBlob: Blob;
  rows: ParentUserInfoRow[];
  // Previous issues: returned our own made-up Parent User IDs (see registry note below).
  // /** Maps normalized parent key -> 5-digit Parent User ID (6XXXX) for Step 5 */
  // parentIdMap: Map<string, string>;
}

// ── Persistent 5-digit Parent ID (6XXXX) Registry ─────────────────────────────
// Previous issues: we generated our own Parent User IDs (60001, 60002, ...) and
// kept them in localStorage. The Parent User ID (Step 5 "Staff ID") is created by
// Focus SIS after the Step 4 import, so ours would never match. Removed.
//
// const STORAGE_KEY_MAP = "focus_parent_id_map";
// const STORAGE_KEY_SEQ = "focus_parent_id_seq";
// const INITIAL_PARENT_SEQ = 60000;
//
// const memoryParentMap = new Map<string, string>();
// let memoryParentSeq = INITIAL_PARENT_SEQ;
//
// export function getOrCreateParentId(parentKey: string): string {
//   const key = norm(parentKey);
//   if (!key) return "";
//
//   // Load from localStorage if in browser
//   if (typeof window !== "undefined") {
//     try {
//       const savedMap = localStorage.getItem(STORAGE_KEY_MAP);
//       if (savedMap && memoryParentMap.size === 0) {
//         const parsed = JSON.parse(savedMap) as Record<string, string>;
//         for (const [k, v] of Object.entries(parsed)) memoryParentMap.set(k, v);
//       }
//       const savedSeq = localStorage.getItem(STORAGE_KEY_SEQ);
//       if (savedSeq) {
//         memoryParentSeq = Math.max(memoryParentSeq, parseInt(savedSeq, 10) || INITIAL_PARENT_SEQ);
//       }
//     } catch {
//       // Fallback to in-memory only if storage is blocked
//     }
//   }
//
//   const existing = memoryParentMap.get(key);
//   if (existing) return existing;
//
//   memoryParentSeq += 1;
//   const newId = String(memoryParentSeq); // e.g. "60001"
//   memoryParentMap.set(key, newId);
//
//   if (typeof window !== "undefined") {
//     try {
//       localStorage.setItem(
//         STORAGE_KEY_MAP,
//         JSON.stringify(Object.fromEntries(memoryParentMap)),
//       );
//       localStorage.setItem(STORAGE_KEY_SEQ, String(memoryParentSeq));
//     } catch {
//       // Ignore storage quota errors
//     }
//   }
//
//   return newId;
// }

// ── Value transformers ────────────────────────────────────────────────────────

// Spec format for Contact Cell Phone: (123) 456-7890
function asPhone(val: unknown): string {
  if (val === null || val === undefined) return "";
  const raw = typeof val === "number" ? String(Math.round(val)) : String(val).trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

// ── Row mapper ────────────────────────────────────────────────────────────────

// Username = Contact Email, so the email is what makes a parent unique in Focus.
// No email → no key → the parent can't get an account and is skipped.
export function getParentKey(raw: unknown[], idx: HeaderIndex): string {
  const email = asString(getCell(raw, idx, "Parent Email", "Contact Email", "EMAIL"));
  return norm(email);

  // Previous issues: fell back to name + phone when the email was blank, but a
  // parent without an email has no Username, so that row could never be imported.
  // The name fallback also read the student's name (see mapRow note).
  // const email = asString(getCell(raw, idx, "Parent Email", "Contact Email", "EMAIL"));
  // if (email) return norm(email);
  //
  // const first = asString(getCell(raw, idx, "Contact First Name", "First Name", "FIRST_NAME"));
  // const last  = asString(getCell(raw, idx, "Contact Last Name", "Last Name", "LAST_NAME"));
  // const phone = asPhone(getCell(raw, idx, "Contact Value", "Contact Cell Phone", "CONTACT_VALUE1"));
  // if (!first && !last && !phone) return "";
  // return norm(`${first}|${last}|${phone}`);
}

function mapRow(
  raw: unknown[],
  idx: HeaderIndex,
  details: ConversionDetails,
): ParentUserInfoRow {
  const email = asString(getCell(raw, idx, "Parent Email", "Contact Email", "EMAIL"));

  return {
    "Contact Relationship": asString(
      getCell(raw, idx, "Relationship", "Contact Relationship", "STUDENT_RELATION"),
    ),
    // Previous issues: the district file has First/Middle/Last Name twice (student
    // first, parent second). buildHeaderIndex now keeps the plain name for the first
    // (student) set, so "First Name" returned the student's name here.
    // "Contact First Name": asString(
    //   getCell(raw, idx, "Contact First Name", "First Name", "FIRST_NAME"),
    // ),
    // "Contact Middle Name": asString(
    //   getCell(raw, idx, "Contact Middle Name", "Middle Name", "MIDDLE_NAME"),
    // ),
    // "Contact Last Name": asString(
    //   getCell(raw, idx, "Contact Last Name", "Last Name", "LAST_NAME"),
    // ),
    // Parent name = the second First/Middle/Last Name columns (same as student-contact.ts)
    "Contact First Name":  asString(getCell(raw, idx, "First Name.1")),
    "Contact Middle Name": asString(getCell(raw, idx, "Middle Name.1")),
    "Contact Last Name":   asString(getCell(raw, idx, "Last Name.1")),
    "Contact Email": email,
    // Parent phone is "Contact Value" in the district file
    "Contact Cell Phone": asPhone(
      getCell(raw, idx, "Contact Value", "Contact Cell Phone", "CONTACT_VALUE1"),
    ),
    // TTU Local Student ID = External School ID / Student School ID
    "TTU Local Student ID": asString(
      getCell(raw, idx, "External School ID", "Student School ID", "TTU Local Student ID"),
    ),
    // Previous issues: hardcoded instead of using the Parent Profile picked in Confirm Details.
    // "Profile ID": "[P3] Parent (TTU)",
    "Profile ID": details.parentProfile,
    "Username": email,
  };
}

// ── CSV serialiser ────────────────────────────────────────────────────────────

function rowToCsvLine(row: ParentUserInfoRow): string {
  return PARENT_USER_INFO_HEADERS.map((h) => csvEscape(row[h])).join(",");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildParentUserInfoCsv(
  headers: string[],
  rawRows: unknown[][],
  details: ConversionDetails,
): ParentUserInfoResult {
  const idx = buildHeaderIndex(headers);
  const { dataRows } = skipFormatHintRow(rawRows);

  const mappedRows: ParentUserInfoRow[] = [];
  const seenParentsInBatch = new Set<string>();

  for (const raw of dataRows) {
    if (raw.every((v) => v === null || v === undefined || String(v).trim() === "")) {
      continue;
    }

    const parentKey = getParentKey(raw, idx);
    if (!parentKey) continue;

    // Previous issues: generated our own Parent User ID here (removed, see registry note).
    // const parentId = getOrCreateParentId(parentKey);
    // parentIdMap.set(parentKey, parentId);

    // One row per parent: Step 4 creates one account per Username (email).
    // Siblings get linked to the same parent in Step 5.
    if (seenParentsInBatch.has(parentKey)) {
      continue;
    }
    seenParentsInBatch.add(parentKey);

    mappedRows.push(mapRow(raw, idx, details));
  }

  const csvLines = [
    PARENT_USER_INFO_HEADERS.join(","),
    ...mappedRows.map(rowToCsvLine),
  ];

  const csvBlob = new Blob(["﻿" + csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });

  return { csvBlob, rows: mappedRows };
}
