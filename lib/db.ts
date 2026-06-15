import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME ?? "ttu_online_dev",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    trustServerCertificate: true,
    encrypt: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
};

let pool: sql.ConnectionPool | null = null;

export async function getDb(): Promise<sql.ConnectionPool> {
  if (!pool) pool = await new sql.ConnectionPool(config).connect();
  return pool;
}
