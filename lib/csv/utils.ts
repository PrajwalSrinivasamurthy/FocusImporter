// Shared helpers used by every CSV builder.

export interface HeaderIndex {
  [normalizedHeader: string]: number;
}

export function norm(h: unknown): string {
  return String(h ?? "").trim().toLowerCase();
}

export function buildHeaderIndex(headers: string[]): HeaderIndex {
  const idx: HeaderIndex = {};
  headers.forEach((h, i) => { idx[norm(h)] = i; });
  return idx;
}

export function getCell(
  row: unknown[],
  idx: HeaderIndex,
  ...aliases: string[]
): unknown {
  for (const alias of aliases) {
    const i = idx[norm(alias)];
    if (i !== undefined && i < row.length) return row[i];
  }
  return null;
}

const FORMAT_HINT_VALUES = new Set([
  "mm/dd/yyyy", "m/f", "y/n", "dd/mm/yyyy", "yyyy/mm/dd",
]);

export function isFormatHintRow(row: unknown[]): boolean {
  return row.some(
    (v) => v !== null && v !== undefined && FORMAT_HINT_VALUES.has(norm(v)),
  );
}

export function asString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export function colLetter(colIdx: number): string {
  let result = "";
  let n = colIdx;
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

// zeroPad=true → single-digit grades become "09" (enrollment GRADE_ID lookup).
// zeroPad=false (default) → plain "9" (student info select field).
export function asGrade(val: unknown, zeroPad = false): string {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) {
    const serial = Math.round(val.getTime() / 86400000 + 25569);
    return serial >= 1 ? asGrade(serial, zeroPad) : "";
  }
  if (typeof val === "number") {
    const n = Math.round(val);
    return zeroPad && n >= 1 && n <= 9 ? `0${n}` : String(n);
  }
  const s = String(val).trim();
  const parsed = parseInt(s, 10);
  if (!isNaN(parsed) && String(parsed) === s) {
    return zeroPad && parsed >= 1 && parsed <= 9 ? `0${parsed}` : String(parsed);
  }
  return s;
}

export function csvEscape(val: string): string {
  if (/[,"\r\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

// Forces a spreadsheet app (Excel, Numbers) to treat the field as text,
// preserving leading zeros. Uses Excel's formula syntax: ="001"
// Import systems that read raw CSV will receive the string value directly.
export function forceText(val: string): string {
  if (val === "") return "";
  return `="${val.replace(/"/g, '""')}"`;
}

export function skipFormatHintRow(rawRows: unknown[][]): {
  dataRows: unknown[][];
  hintOffset: number;
} {
  const hasHint = rawRows.length > 0 && isFormatHintRow(rawRows[0]);
  return {
    dataRows: hasHint ? rawRows.slice(1) : rawRows,
    hintOffset: hasHint ? 1 : 0,
  };
}
