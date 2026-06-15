import { API_BASE_URL, type ApiClient } from "@/lib/api/client";
import type { ConversionDetails, ConversionManifest, PushReceipt } from "@/lib/types";

export class HttpApiClient implements ApiClient {
  async convert(
    file: File,
    details: ConversionDetails,
    onStage?: (stage: number) => void
  ): Promise<ConversionManifest> {
    onStage?.(0);
    const form = new FormData();
    form.append("file", file);
    form.append("details", JSON.stringify(details));
    const res = await fetch(`${API_BASE_URL}/api/conversions`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`Conversion failed (${res.status})`);
    onStage?.(3);
    return res.json();
  }

  async downloadFile(jobId: string, fileName: string): Promise<void> {
    const res = await fetch(
      `${API_BASE_URL}/api/conversions/${jobId}/files/${encodeURIComponent(fileName)}`
    );
    if (res.status === 410) throw new Error("File has expired. Please re-upload.");
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async pushToFocus(jobId: string, ignoreIssues: boolean): Promise<PushReceipt> {
    const res = await fetch(`${API_BASE_URL}/api/conversions/${jobId}/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ignoreIssues }),
    });
    if (!res.ok) throw new Error(`Push failed (${res.status})`);
    return res.json();
  }
}
