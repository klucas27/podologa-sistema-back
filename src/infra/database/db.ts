import mysql from "mysql2/promise";

const raw = process.env["DATABASE_URL"] ?? "";
const url = new URL(raw);

export const pool = mysql.createPool({
  host:     url.hostname,
  port:     url.port ? parseInt(url.port, 10) : 3306,
  user:     decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),

  // ── Pool sizing — conservativo para VPS 256 MB ──────────
  connectionLimit:  5,
  waitForConnections: true,
  queueLimit:       0,
  connectTimeout:   10_000,

  // ── Charset ────────────────────────────────────────────
  charset: "utf8mb4",

  // ── Type casting ───────────────────────────────────────
  // TINYINT(1) → boolean   /   DECIMAL → number
  typeCast(field, next) {
    if (field.type === "TINY" && field.length === 1) {
      return field.string() === "1";
    }
    if (field.type === "NEWDECIMAL") {
      const v = field.string();
      return v === null ? null : parseFloat(v);
    }
    return next();
  },
});

export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
