import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * SQLite database location.
 *
 * In Docker we mount: ./data:/app/data
 * so the DB is persisted at /app/data/focusimporter.sqlite
 */
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = process.env.SQLITE_PATH ?? path.join(DATA_DIR, "focusimporter.sqlite");

let db: Database.Database | null = null;

function ensureSchema(d: Database.Database) {
  // ── Users ────────────────────────────────────────────────────────────────
  // Plaintext password per current requirements.
  d.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration support from older schemas (best-effort)
  try {
    const cols = d
      .prepare("PRAGMA table_info('dashboard_users')")
      .all() as Array<{ name: string }>;
    const names = new Set(cols.map((c) => c.name));
    if (!names.has("password")) d.exec("ALTER TABLE dashboard_users ADD COLUMN password TEXT");
    if (!names.has("created_at")) d.exec("ALTER TABLE dashboard_users ADD COLUMN created_at DATETIME");
  } catch {
    // Ignore migration issues; app will error clearly at query-time.
  }

  // ── Conversion history ───────────────────────────────────────────────────
  d.exec(`
    CREATE TABLE IF NOT EXISTS focus_conversion_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      job_id TEXT NOT NULL,
      source_file TEXT NOT NULL,
      output_files TEXT NOT NULL,
      issue_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'complete',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_focus_history_email_created
      ON focus_conversion_history(email, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_history_email_job
      ON focus_conversion_history(email, job_id);
  `);

  // If an older focus_conversion_history exists with user_id, migrate into the
  // new email-based table shape.
  try {
    const cols = d
      .prepare("PRAGMA table_info('focus_conversion_history')")
      .all() as Array<{ name: string }>;
    const names = new Set(cols.map((c) => c.name));
    if (names.has("user_id") && !names.has("email")) {
      d.exec("ALTER TABLE focus_conversion_history RENAME TO focus_conversion_history_old");
      d.exec(`
        CREATE TABLE IF NOT EXISTS focus_conversion_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          job_id TEXT NOT NULL,
          source_file TEXT NOT NULL,
          output_files TEXT NOT NULL,
          issue_count INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'complete',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Best-effort backfill with a placeholder email.
      d.exec(`
        INSERT INTO focus_conversion_history (email, job_id, source_file, output_files, issue_count, status, created_at)
        SELECT 'unknown@local', job_id, source_file, output_files, issue_count, status, created_at
        FROM focus_conversion_history_old;
      `);
      d.exec("DROP TABLE focus_conversion_history_old");
    }
  } catch {
    // Ignore migration issues.
  }
}

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    ensureSchema(db);
  }
  return db;
}
