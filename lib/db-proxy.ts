const PROXY_URL = process.env.FOCUS_DB_PROXY_URL ?? "http://127.0.0.1:8000/focus/query";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

// The host's Node mssql driver can't do Windows/Kerberos auth on Linux, so
// queries are forwarded to a local FastAPI service (pyodbc, Trusted_Connection).
export async function dbQuery<T = Record<string, unknown>>(
  sqlText: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": INTERNAL_API_KEY,
    },
    body: JSON.stringify({ sql: sqlText, params }),
  });

  if (!res.ok) {
    throw new Error(`DB proxy request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { records: T[] };
  return data.records;
}
