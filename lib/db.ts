import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "app.db");

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS dashboard_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        project TEXT NOT NULL DEFAULT 'Focus',
        permissions TEXT NOT NULL DEFAULT '',
        token_version INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS focus_conversion_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        job_id TEXT NOT NULL,
        source_file TEXT NOT NULL,
        output_files TEXT NOT NULL,
        issue_count INTEGER NOT NULL DEFAULT 0,
        issues_overridden INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'complete',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return db;
}
