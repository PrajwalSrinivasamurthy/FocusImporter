import type { ValidationIssue } from "@/lib/types";
import {
  buildHeaderIndex,
  colLetter,
  norm,
  skipFormatHintRow,
} from "@/lib/csv/utils";

// ── Issue finder ──────────────────────────────────────────────────────────────
// Runs independently of the CSV builders: it only reads the parsed workbook and
// reports problems. Row numbers match the original spreadsheet (header = row 1).

export function findIssues(
  headers: string[],
  rawRows: unknown[][],
): ValidationIssue[] {
  const idx = buildHeaderIndex(headers);
  const issues: ValidationIssue[] = [];

  const { dataRows, hintOffset } = skipFormatHintRow(rawRows);

  const emailColIdx = idx[norm("Student Email")] ?? -1;
  const schoolIdColIdx =
    idx[norm("External School ID")] ?? idx[norm("Student School ID")] ?? -1;

  for (let i = 0; i < dataRows.length; i++) {
    const raw = dataRows[i];
    const sourceRowNum = i + 2 + hintOffset;

    // Fully blank rows are ignored, not reported
    if (raw.every((v) => v === null || v === undefined || String(v).trim() === "")) {
      continue;
    }

    const schoolIdVal = schoolIdColIdx >= 0 ? raw[schoolIdColIdx] : null;
    if (!schoolIdVal || String(schoolIdVal).trim() === "") {
      issues.push({
        id: crypto.randomUUID(),
        column: "External School ID",
        row: sourceRowNum,
        cell: `${colLetter(Math.max(schoolIdColIdx, 0))}${sourceRowNum}`,
        type: "empty_cell",
        message: `External School ID or Student School ID is missing at row ${sourceRowNum}.`,
      });
    }

    if (emailColIdx >= 0) {
      const emailStr = emailColIdx < raw.length && raw[emailColIdx] !== null
        ? String(raw[emailColIdx]).trim()
        : "";

      if (emailStr === "") {
        issues.push({
          id: crypto.randomUUID(),
          column: "Student Email",
          row: sourceRowNum,
          cell: `${colLetter(emailColIdx)}${sourceRowNum}`,
          type: "empty_cell",
          message: `Student Email is missing at row ${sourceRowNum}.`,
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
        issues.push({
          id: crypto.randomUUID(),
          column: "Student Email",
          row: sourceRowNum,
          cell: `${colLetter(emailColIdx)}${sourceRowNum}`,
          type: "invalid_value",
          message: `'${emailStr}' is not a valid email address at row ${sourceRowNum}.`,
        });
      }
    }
  }

  return issues;
}
