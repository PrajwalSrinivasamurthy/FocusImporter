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
  d.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      project TEXT NOT NULL DEFAULT 'focusimporter',
      permissions TEXT NOT NULL DEFAULT ''
    );
  `);

  d.exec(`
    CREATE TABLE IF NOT EXISTS focus_conversion_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      job_id TEXT NOT NULL,
      source_file TEXT NOT NULL,
      output_files TEXT NOT NULL,
      issue_count INTEGER NOT NULL DEFAULT 0,
      issues_overridden INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'complete',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES dashboard_users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_focus_history_user_created
      ON focus_conversion_history(user_id, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_history_user_job
      ON focus_conversion_history(user_id, job_id);
  `);
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
