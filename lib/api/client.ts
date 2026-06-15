import type { ConversionDetails, ConversionManifest, PushReceipt } from "@/lib/types";

export interface ApiClient {
  convert(
    file: File,
    details: ConversionDetails,
    onStage?: (stage: number) => void
  ): Promise<ConversionManifest>;
  downloadFile(jobId: string, fileName: string): Promise<void>;
  pushToFocus(jobId: string, ignoreIssues: boolean): Promise<PushReceipt>;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
