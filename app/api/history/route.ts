import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

// ── GET /api/history ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { ip, userAgent } = requestMeta(req);
  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT job_id, source_file, output_files,
                issue_count, status, created_at
         FROM focus_conversion_history
         WHERE email = ?
         ORDER BY created_at DESC`,
      )
      .all(email) as Array<{
      job_id: string;
      source_file: string;
      output_files: string;
      issue_count: number;
      status: string;
      created_at: string;
    }>;

    const records = rows.map((r) => ({
      jobId:            r.job_id,
      createdAt:        r.created_at,
      sourceFileName:   r.source_file,
      outputFiles:      r.output_files,
      issueCount:       r.issue_count,
      issuesOverridden: false,
      status:           r.status,
    }));

    log({
      level: "info",
      event: "history.fetched",
      email,
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
      email,
      ip,
      userAgent,
      details: { error: String(err) },
    });
    return NextResponse.json({ error: "Failed to fetch history." }, { status: 500 });
  }
}

// ── POST /api/history ─────────────────────────────────────────────────────────

interface InsertBody {
  email: string;
  jobId: string;
  sourceFile: string;
  outputFiles: string;
  issueCount: number;
  status: string;
}

export async function POST(req: NextRequest) {
  const { ip, userAgent } = requestMeta(req);

  let body: InsertBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO focus_conversion_history
         (email, job_id, source_file, output_files, issue_count, status)
       VALUES
         (?, ?, ?, ?, ?, ?)`,
    ).run(
      email,
      body.jobId,
      body.sourceFile,
      body.outputFiles,
      body.issueCount,
      body.status,
    );

    log({
      level: "info",
      event: "conversion.saved",
      email,
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
      email,
      ip,
      userAgent,
      details: { error: String(err) },
    });
    return NextResponse.json({ error: "Failed to save history." }, { status: 500 });
  }
}
