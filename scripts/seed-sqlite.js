/* eslint-disable no-console */
const path = require("node:path");
const fs = require("node:fs");
const bcrypt = require("bcryptjs");

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = process.env.SQLITE_PATH ?? path.join(DATA_DIR, "focusimporter.sqlite");

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Lazy-require so the script doesn't crash if deps aren't installed yet.
  const Database = require("better-sqlite3");
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      project TEXT NOT NULL DEFAULT 'focusimporter',
      permissions TEXT NOT NULL DEFAULT ''
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

  const email = "marissa.sanchez@ttu.edu";
  const password = "TtuOnline2026.";
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = db.prepare("SELECT id FROM dashboard_users WHERE email = ?").get(email);

  if (existing) {
    db.prepare("UPDATE dashboard_users SET password_hash = ?, project = 'focusimporter' WHERE email = ?")
      .run(passwordHash, email);
    console.log(`[seed] Updated existing user: ${email}`);
  } else {
    db.prepare(
      "INSERT INTO dashboard_users (email, password_hash, project, permissions) VALUES (?, ?, 'focusimporter', '')",
    ).run(email, passwordHash);
    console.log(`[seed] Created user: ${email}`);
  }

  console.log(`[seed] DB path: ${DB_PATH}`);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
