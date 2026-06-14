import { NextResponse, type NextRequest } from "next/server";
import sql from "mssql";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

// ── GET /api/history ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { ip, userAgent } = requestMeta(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Session expired." }, { status: 401 });

  try {
    const db = await getDb();
    const result = await db
      .request()
      .input("userId", sql.Int, session.userId)
      .query<{
        job_id: string;
        source_file: string;
        output_files: string;
        issue_count: number;
        issues_overridden: boolean;
        status: string;
        created_at: string;
      }>(`
        SELECT job_id, source_file, output_files,
               issue_count, issues_overridden, status, created_at
        FROM   dbo.focus_conversion_history
        WHERE  user_id = @userId
        ORDER  BY created_at DESC
      `);

    const records = result.recordset.map((r) => ({
      jobId:            r.job_id,
      createdAt:        r.created_at,
      sourceFileName:   r.source_file,
      outputFiles:      r.output_files,
      issueCount:       r.issue_count,
      issuesOverridden: Boolean(r.issues_overridden),
      status:           r.status,
    }));

    log({
      level: "info",
      event: "history.fetched",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
      details: { recordCount: records.length },
    });

    return NextResponse.json(records);
  } catch (err) {
    console.error("[history/GET]", err);
    log({
      level: "error",
      event: "history.fetch.error",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
      details: { error: String(err) },
    });
    return NextResponse.json({ error: "Failed to fetch history." }, { status: 500 });
  }
}

// ── POST /api/history ─────────────────────────────────────────────────────────

interface InsertBody {
  jobId: string;
  sourceFile: string;
  outputFiles: string;
  issueCount: number;
  status: string;
}

export async function POST(req: NextRequest) {
  const { ip, userAgent } = requestMeta(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Session expired." }, { status: 401 });

  let body: InsertBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const db = await getDb();
    await db
      .request()
      .input("userId",      sql.Int,           session.userId)
      .input("jobId",       sql.VarChar(64),   body.jobId)
      .input("sourceFile",  sql.NVarChar(255),  body.sourceFile)
      .input("outputFiles", sql.NVarChar(500),  body.outputFiles)
      .input("issueCount",  sql.Int,            body.issueCount)
      .input("status",      sql.VarChar(30),    body.status)
      .query(`
        INSERT INTO dbo.focus_conversion_history
          (user_id, job_id, source_file, output_files, issue_count, status)
        VALUES
          (@userId, @jobId, @sourceFile, @outputFiles, @issueCount, @status)
      `);

    log({
      level: "info",
      event: "conversion.saved",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
      details: {
        jobId:       body.jobId,
        sourceFile:  body.sourceFile,
        outputFiles: body.outputFiles,
        issueCount:  body.issueCount,
        status:      body.status,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[history/POST]", err);
    log({
      level: "error",
      event: "conversion.save.error",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
      details: { error: String(err) },
    });
    return NextResponse.json({ error: "Failed to save history." }, { status: 500 });
  }
}
