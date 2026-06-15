import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { dbQuery } from "@/lib/db-proxy";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

export async function PUT(req: NextRequest) {
  const { ip, userAgent } = requestMeta(req);

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Session expired." }, { status: 401 });

  let currentPassword: string, newPassword: string;
  try {
    ({ currentPassword, newPassword } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  try {
    const rows = await dbQuery<{ password_hash: string }>(
      "SELECT password_hash FROM dbo.dashboard_users WHERE id = @userId",
      { userId: session.userId },
    );

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      log({
        level: "warn",
        event: "settings.password.wrong_current",
        userId: session.userId,
        email: session.email,
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await dbQuery(
      `UPDATE dbo.dashboard_users
       SET password_hash  = @hash,
           token_version  = token_version + 1,
           updated_at     = SYSUTCDATETIME()
       WHERE id = @userId`,
      { userId: session.userId, hash: newHash },
    );

    log({
      level: "info",
      event: "settings.password.changed",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  } catch (err) {
    console.error("[settings/password]", err);
    log({
      level: "error",
      event: "settings.password.error",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
      details: { error: String(err) },
    });
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
