import fs from "fs";
import path from "path";

// ── Config ────────────────────────────────────────────────────────────────────

const LOG_DIR  = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "logs.json");

// ── Types ─────────────────────────────────────────────────────────────────────

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  userId?: number;
  email?: string;
  ip: string;
  userAgent: string;
  details?: Record<string, unknown>;
}

// ── Core writer ───────────────────────────────────────────────────────────────
// Each call appends one JSON object followed by a newline (JSONL format).
// appendFileSync keeps lines in exact arrival order without race conditions.

export function log(entry: Omit<LogEntry, "timestamp">): void {
  const record: LogEntry = { timestamp: new Date().toISOString(), ...entry };
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(record) + "\n", "utf8");
  } catch (err) {
    console.error("[logger] failed to write log:", err);
  }
}

// ── Request helpers ───────────────────────────────────────────────────────────

export function requestMeta(req: Request): { ip: string; userAgent: string } {
  const h = req.headers;
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? h.get("x-real-ip")
      ?? "unknown",
    userAgent: h.get("user-agent") ?? "unknown",
  };
}
