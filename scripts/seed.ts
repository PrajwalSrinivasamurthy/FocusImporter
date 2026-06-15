import bcrypt from "bcryptjs";
import { db } from "../lib/db";

const email = "admin@ttu.edu";
const password = "Admin123!";

const existing = db
  .prepare<[string], { id: number }>("SELECT id FROM dashboard_users WHERE email = ?")
  .get(email);

if (existing) {
  console.log(`User ${email} already exists (id=${existing.id}); skipping.`);
} else {
  const hash = bcrypt.hashSync(password, 12);
  db.prepare(
    `INSERT INTO dashboard_users (email, password_hash, project, permissions, token_version)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(email, hash, "Focus", "", 0);
  console.log(`Created admin user ${email}`);
}
