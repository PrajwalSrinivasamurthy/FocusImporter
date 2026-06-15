/**
 * The API contract. These types mirror the backend Pydantic schemas
 * field-for-field. If a field changes here, it changes there too.
 */

export interface ConversionDetails {
  regionCode: string;
  profile: string;
  syear: string;
  enrollmentCode: string;
  startDate: string; // MM/DD/YYYY
  schoolId: string;  // always treated as string to preserve leading zeros (e.g. "001")
}

export type ConversionStatus = "completed" | "completed_with_issues";

export interface ValidationIssue {
  id: string;
  column: string;
  row: number;
  cell: string; // e.g. "A5"
  type: "empty_cell" | "empty_row" | "invalid_value";
  message: string;
}

export interface OutputFile {
  name: string;
  downloadUrl: string;
  sizeBytes: number;
  rowCount: number;
  colCount: number;
}

export interface ConversionManifest {
  jobId: string;
  status: ConversionStatus;
  sourceFileName: string;
  createdAt: string; // ISO
  issues: ValidationIssue[];
  files: OutputFile[];
}

export interface PushReceipt {
  jobId: string;
  pushedAt: string;
  destination: string;
  fileHashes: Record<string, string>;
}

export interface HistoryRecord {
  jobId: string;
  createdAt: string;
  sourceFileName: string;
  outputFiles: string;       // semicolon-separated: "File1.xlsx;File2.xlsx;File3.xlsx"
  issueCount: number;
  issuesOverridden: boolean; // true when user acknowledged issues before downloading
  status: ConversionStatus;
}
