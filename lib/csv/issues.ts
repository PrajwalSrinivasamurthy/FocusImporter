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

  // Parent columns (Step 4). Parent name = the second First/Last Name columns.
  const parentEmailColIdx = idx[norm("Parent Email")] ?? -1;
  const parentFirstColIdx = idx[norm("First Name.1")] ?? -1;
  const parentLastColIdx  = idx[norm("Last Name.1")] ?? -1;
  // Parent email -> first row that used it, to catch one email shared by different parents
  const parentByEmail = new Map<string, { name: string; row: number }>();

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

    // Parent Email is the parent's Username in Step 4 (Parent User Information).
    if (parentEmailColIdx >= 0) {
      const cellStr = (colIdx: number) =>
        colIdx >= 0 && colIdx < raw.length && raw[colIdx] !== null
          ? String(raw[colIdx]).trim()
          : "";
      const parentEmail = cellStr(parentEmailColIdx);

      if (parentEmail === "") {
        // No email → no Username → the parent row is skipped in Step 4
        issues.push({
          id: crypto.randomUUID(),
          column: "Parent Email",
          row: sourceRowNum,
          cell: `${colLetter(parentEmailColIdx)}${sourceRowNum}`,
          type: "empty_cell",
          message: `Parent Email is missing at row ${sourceRowNum} — no parent account will be created.`,
        });
      } else {
        // Step 4 keeps one row per email, so different parents sharing an email get merged.
        // The same parent listed for siblings (same name) is fine and not reported.
        const parentName = `${cellStr(parentFirstColIdx)} ${cellStr(parentLastColIdx)}`.trim();
        const first = parentByEmail.get(norm(parentEmail));

        if (!first) {
          parentByEmail.set(norm(parentEmail), { name: parentName, row: sourceRowNum });
        } else if (norm(first.name) !== norm(parentName)) {
          issues.push({
            id: crypto.randomUUID(),
            column: "Parent Email",
            row: sourceRowNum,
            cell: `${colLetter(parentEmailColIdx)}${sourceRowNum}`,
            type: "invalid_value",
            message: `Parent Email '${parentEmail}' at row ${sourceRowNum} is also used by ${first.name || "another parent"} at row ${first.row} — they will be merged into one parent account.`,
          });
        }
      }
    }
  }

  return issues;
}
