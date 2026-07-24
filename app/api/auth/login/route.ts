import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let email: string, password: string;
  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const normalized = email?.trim().toLowerCase();
  if (!normalized || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const db = getDb();
    const row = db
      .prepare("SELECT email, password FROM dashboard_users WHERE email = ?")
      .get(normalized) as { email: string; password: string } | undefined;

    if (!row || row.password !== password) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    return NextResponse.json({ ok: true, email: row.email });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }

  /*
  const { ip, userAgent } = requestMeta(req);
  let email: string, password: string;

  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email?.trim() || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  try {
    const db = getDb();

    const user = db
      .prepare(
        `SELECT id, email, password_hash, project, permissions
         FROM dashboard_users
         WHERE email = ?`,
      )
      .get(email.trim().toLowerCase()) as
      | {
          id: number;
          email: string;
          password_hash: string;
          project: string;
          permissions: string;
        }
      | undefined;

    // Run bcrypt even when user not found to prevent timing-based enumeration.
    const hash = user?.password_hash ?? "$2b$12$notarealhashjustfortimingggggggggggggg";
    const match = await bcrypt.compare(password, hash);

    if (!user || !match) {
      log({
        level: "warn",
        event: "auth.login.failed",
        email: email.trim().toLowerCase(),
        ip,
        userAgent,
        details: { reason: !user ? "user_not_found" : "wrong_password" },
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.project !== "focusimporter") {
      log({
        level: "warn",
        event: "auth.login.not_whitelisted",
        userId: user.id,
        email: user.email,
        ip,
        userAgent,
        details: { project: user.project },
      });
      return NextResponse.json(
        { error: "Your Email is not Whitelisted, Please contact TTU Online Development team." },
        { status: 403 }
      );
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
      permissions: user.permissions ?? "",
    });

    log({
      level: "info",
      event: "auth.login.success",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      details: { permissions: user.permissions ?? "" },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      // NOTE: This app is deployed behind nginx on a LAN; do NOT gate this on NODE_ENV.
      secure: false,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/focusimporter",
    });

    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    log({
      level: "error",
      event: "auth.login.error",
      email: email.trim().toLowerCase(),
      ip,
      userAgent,
      details: { error: String(err) },
    });
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
  */
}
