import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

interface Body {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export async function POST(req: NextRequest) {
  const { ip, userAgent } = requestMeta(req);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const normalized = body.email?.trim().toLowerCase();
  if (!normalized || !body.currentPassword || !body.newPassword) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (body.newPassword.length < 5) {
    return NextResponse.json({ error: "New password must be at least 5 characters." }, { status: 400 });
  }

  try {
    const db = getDb();
    const row = db
      .prepare("SELECT email, password FROM dashboard_users WHERE email = ?")
      .get(normalized) as { email: string; password: string } | undefined;

    if (!row) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (row.password !== body.currentPassword) {
      log({
        level: "warn",
        event: "auth.change_password.wrong_current",
        email: normalized,
        ip,
        userAgent,
      });
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    db.prepare("UPDATE dashboard_users SET password = ? WHERE email = ?").run(body.newPassword, normalized);

    log({
      level: "info",
      event: "auth.change_password.success",
      email: normalized,
      ip,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/change-password]", err);
    log({
      level: "error",
      event: "auth.change_password.error",
      email: normalized,
      ip,
      userAgent,
      details: { error: String(err) },
    });
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
