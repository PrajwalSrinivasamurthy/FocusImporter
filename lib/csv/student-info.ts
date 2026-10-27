import type { ConversionDetails } from "@/lib/types";
// Previous issues imports (moved to lib/csv/issues.ts): ValidationIssue, colLetter, norm
import {
  asString,
  buildHeaderIndex,
  csvEscape,
  getCell,
  skipFormatHintRow,
  type HeaderIndex,
} from "@/lib/csv/utils";

// ── Output schema ─────────────────────────────────────────────────────────────

export interface StudentInfoRow {
  "Student School ID": string;
  "Unique State ID": string;
  "Last Name": string;
  "First Name": string;
  "Middle Name": string;
  "Birth Date": string;
  "Gender": string;
  "Student Email": string;
  "HISP/LAT": string;
  "AMERICAN INDIAN OR ALASKA NATIVE": string;
  "ASIAN": string;
  "BLACK OR AFRICAN AMERICAN": string;
  "NATIVE HAWAIIAN OR OTHER PACIFIC ISLANDER": string;
  "WHITE": string;
  "US Citizen": string;
  "Region": string;
  "TTU Local Student ID": string;
  "Profile": string;
}

export const STUDENT_INFO_HEADERS: ReadonlyArray<keyof StudentInfoRow> = [
  "Student School ID",
  "Unique State ID",
  "Last Name",
  "First Name",
  "Middle Name",
  "Birth Date",
  "Gender",
  "Student Email",
  "HISP/LAT",
  "AMERICAN INDIAN OR ALASKA NATIVE",
  "ASIAN",
  "BLACK OR AFRICAN AMERICAN",
  "NATIVE HAWAIIAN OR OTHER PACIFIC ISLANDER",
  "WHITE",
  "US Citizen",
  "Region",
  "TTU Local Student ID",
  "Profile",
] as const;

export interface StudentInfoResult {
  csvBlob: Blob;
  rows: StudentInfoRow[];
  // Previous issues field (now produced by findIssues in lib/csv/issues.ts)
  // issues: ValidationIssue[];
}

// ── Value transformers ────────────────────────────────────────────────────────

function convertYN(val: unknown): string {
  const s = String(val ?? "").trim().toUpperCase();
  if (s === "Y" || s === "YES" || s === "1") return "1";
  if (s === "N" || s === "NO" || s === "0") return "0";
  if (s === "") return "";
  return s;
}

// Citizenship is a Y/N field (unlike the race flags, which are 1/0).
function convertCitizen(val: unknown): string {
  const s = String(val ?? "").trim().toUpperCase();
  if (s === "Y" || s === "YES" || s === "1") return "Y";
  if (s === "N" || s === "NO" || s === "0") return "N";
  return s;
}

function formatDate(val: unknown): string {
  if (val === null || val === undefined || val === "") return "";

  if (val instanceof Date) {
    const mm = String(val.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(val.getUTCDate()).padStart(2, "0");
    return `${mm}/${dd}/${val.getUTCFullYear()}`;
  }

  if (typeof val === "number") {
    const d = new Date((val - 25569) * 86400_000);
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${mm}/${dd}/${d.getUTCFullYear()}`;
  }

  const s = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;

  const dmy = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const MONTHS: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };
    const month = MONTHS[m.toLowerCase()];
    if (!month) return s;
    const yNum = parseInt(y, 10);
    const year = y.length === 2 ? (yNum <= 30 ? 2000 + yNum : 1900 + yNum) : yNum;
    return `${String(month).padStart(2, "0")}/${String(parseInt(d, 10)).padStart(2, "0")}/${year}`;
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return `${String(parsed.getMonth() + 1).padStart(2, "0")}/${String(parsed.getDate()).padStart(2, "0")}/${parsed.getFullYear()}`;
  }

  return s;
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapRow(
  raw: unknown[],
  idx: HeaderIndex,
  details: ConversionDetails,
): StudentInfoRow {
  // Input has either "External School ID" or "Student School ID"; both are the local student ID.
  const studentSchoolId = asString(
    getCell(raw, idx, "External School ID", "Student School ID"),
  );

  return {
    "Student School ID": studentSchoolId,
    "Unique State ID": asString(getCell(raw, idx, "Unique State ID (TSDS ID)")),
    "Last Name": asString(getCell(raw, idx, "Last Name")),
    "First Name": asString(getCell(raw, idx, "First Name")),
    "Middle Name": asString(getCell(raw, idx, "Middle Name")),
    "Birth Date": formatDate(getCell(raw, idx, "Birth Date")),
    "Gender": asString(getCell(raw, idx, "Gender")),
    "Student Email": asString(getCell(raw, idx, "Student Email")),
    "HISP/LAT": convertYN(getCell(raw, idx, "HISP/LATINO", "HISP/LAT")),
    "AMERICAN INDIAN OR ALASKA NATIVE": convertYN(
      getCell(raw, idx, "RACE: AMERICAN INDIAN OR ALASKA NATIVE", "American Indian or Alaskan Native", "American Indian or Alaska Native"),
    ),
    "ASIAN": convertYN(getCell(raw, idx, "RACE: ASIAN", "Asian")),
    "BLACK OR AFRICAN AMERICAN": convertYN(
      getCell(raw, idx, "RACE: BLACK OR AFRICAN AMERICAN", "Black or African American"),
    ),
    "NATIVE HAWAIIAN OR OTHER PACIFIC ISLANDER": convertYN(
      getCell(raw, idx, "RACE: NATIVE HAWAIIAN OR OTHER PACIFIC ISLANDER", "Native Hawaiian/Pacific Islander", "Native Hawaiian or Other Pacific Islander"),
    ),
    "WHITE": convertYN(getCell(raw, idx, "RACE: WHITE", "White")),
    "US Citizen": convertCitizen(getCell(raw, idx, "US Citizen")),
    "Region": details.regionCode,
    "TTU Local Student ID": studentSchoolId,
    "Profile": details.profile,
  };
}

// ── CSV serialiser ────────────────────────────────────────────────────────────

function rowToCsvLine(row: StudentInfoRow): string {
  return STUDENT_INFO_HEADERS.map((h) => csvEscape(row[h])).join(",");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildStudentInfoCsv(
  headers: string[],
  rawRows: unknown[][],
  details: ConversionDetails,
): StudentInfoResult {
  const idx = buildHeaderIndex(headers);
  // Previous issues: validation now lives in findIssues (lib/csv/issues.ts)
  // const issues: ValidationIssue[] = [];

  const { dataRows } = skipFormatHintRow(rawRows);

  // Previous issues: column lookups used only by the validation below
  // const emailColIdx = idx[norm("Student Email")] ?? -1;
  // const schoolIdColIdx =
  //   idx[norm("External School ID")] ?? idx[norm("Student School ID")] ?? -1;

  const mappedRows: StudentInfoRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const raw = dataRows[i];
    // Previous issues: const sourceRowNum = i + 2 + hintOffset;

    if (raw.every((v) => v === null || v === undefined || String(v).trim() === "")) {
      continue;
    }

    // ── Previous issues (moved to findIssues in lib/csv/issues.ts) ──────────
    // const schoolIdVal = schoolIdColIdx >= 0 ? raw[schoolIdColIdx] : null;
    // if (!schoolIdVal || String(schoolIdVal).trim() === "") {
    //   issues.push({
    //     id: crypto.randomUUID(),
    //     column: "External School ID",
    //     row: sourceRowNum,
    //     cell: `${colLetter(Math.max(schoolIdColIdx, 0))}${sourceRowNum}`,
    //     type: "empty_cell",
    //     message: `External School ID is missing at row ${sourceRowNum}.`,
    //   });
    // }
    //
    // if (emailColIdx >= 0) {
    //   const emailStr = emailColIdx < raw.length && raw[emailColIdx] !== null
    //     ? String(raw[emailColIdx]).trim()
    //     : "";
    //
    //   if (emailStr === "") {
    //     issues.push({
    //       id: crypto.randomUUID(),
    //       column: "Student Email",
    //       row: sourceRowNum,
    //       cell: `${colLetter(emailColIdx)}${sourceRowNum}`,
    //       type: "empty_cell",
    //       message: `Student Email is missing at row ${sourceRowNum}.`,
    //     });
    //   } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    //     issues.push({
    //       id: crypto.randomUUID(),
    //       column: "Student Email",
    //       row: sourceRowNum,
    //       cell: `${colLetter(emailColIdx)}${sourceRowNum}`,
    //       type: "invalid_value",
    //       message: `'${emailStr}' is not a valid email address at row ${sourceRowNum}.`,
    //     });
    //   }
    // }

    mappedRows.push(mapRow(raw, idx, details));
  }

  const csvLines = [
    STUDENT_INFO_HEADERS.join(","),
    ...mappedRows.map(rowToCsvLine),
  ];

  const csvBlob = new Blob(["﻿" + csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });

  return { csvBlob, rows: mappedRows };
}
