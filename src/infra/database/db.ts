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

  // ── Timezone (C3/C4) ───────────────────────────────────
  // mysql2 serializa/desserializa DATETIME como UTC puro.
  // O app usa a convenção "slots UTC = valores de SP" via nowSP(),
  // portanto timezone: '+00:00' garante que o valor gravado seja
  // exatamente o que nowSP() retorna, independente do fuso do host.
  timezone: "+00:00",

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

// ── Timezone de sessão MySQL (C3/C4) ───────────────────────────
// Força time_zone = '-03:00' em cada conexão nova.
// Garante que CURRENT_TIMESTAMP (usado em TIMESTAMP DEFAULT) e
// as leituras/escritas de colunas TIMESTAMP usem horário de SP
// (UTC-3, sem DST desde 2019), alinhado com a convenção do app.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pool as any).pool.on("connection", (conn: any) => {
  conn.query("SET time_zone = '-03:00'");
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
