import * as XLSX from "xlsx";

export interface WorkbookStats {
  rowCount: number; // data rows, header excluded
  colCount: number;
}

export async function readWorkbookStats(file: File): Promise<WorkbookStats> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet["!ref"]) return { rowCount: 0, colCount: 0 };
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  return {
    rowCount: range.e.r - range.s.r, // subtract header row
    colCount: range.e.c - range.s.c + 1,
  };
}
