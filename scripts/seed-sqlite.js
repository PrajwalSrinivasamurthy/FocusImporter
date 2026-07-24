/* eslint-disable no-console */
const path = require("node:path");
const fs = require("node:fs");

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
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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

  // ── Migrations (best-effort) ─────────────────────────────────────────────
  try {
    const cols = db.prepare("PRAGMA table_info('dashboard_users')").all();
    const names = new Set(cols.map((c) => c.name));
    if (!names.has("password")) db.exec("ALTER TABLE dashboard_users ADD COLUMN password TEXT");
    if (!names.has("created_at")) db.exec("ALTER TABLE dashboard_users ADD COLUMN created_at DATETIME");
  } catch {
    // ignore
  }

  try {
    const cols = db.prepare("PRAGMA table_info('focus_conversion_history')").all();
    const names = new Set(cols.map((c) => c.name));
    // If older schema exists (user_id), migrate into email-based schema.
    if (names.has("user_id") && !names.has("email")) {
      db.exec("ALTER TABLE focus_conversion_history RENAME TO focus_conversion_history_old");
      db.exec(`
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
      db.exec(`
        INSERT INTO focus_conversion_history (email, job_id, source_file, output_files, issue_count, status, created_at)
        SELECT 'unknown@local', job_id, source_file, output_files, issue_count, status, created_at
        FROM focus_conversion_history_old;
      `);
      db.exec("DROP TABLE focus_conversion_history_old");
    }
  } catch {
    // ignore
  }

  const email = "marissa.sanchez@ttu.edu";
  const password = "TtuOnline2026.";
  const existing = db.prepare("SELECT id FROM dashboard_users WHERE email = ?").get(email);

  if (existing) {
    db.prepare("UPDATE dashboard_users SET password = ? WHERE email = ?")
      .run(password, email);
    console.log(`[seed] Updated existing user: ${email}`);
  } else {
    db.prepare(
      "INSERT INTO dashboard_users (email, password) VALUES (?, ?)",
    ).run(email, password);
    console.log(`[seed] Created user: ${email}`);
  }

  console.log(`[seed] DB path: ${DB_PATH}`);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
