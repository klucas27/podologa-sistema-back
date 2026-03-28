import dotenv from "dotenv";

dotenv.config();

/**
 * Exige que a variável de ambiente exista.
 * Lança erro imediato se ausente — impede startup com config incompleta.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[ENV] Variável obrigatória ausente: ${key}. Defina-a no .env ou nas variáveis de ambiente do host.`,
    );
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

const NODE_ENV = optionalEnv("NODE_ENV", "development");

export const env = {
  NODE_ENV,
  PORT: Number(optionalEnv("PORT", "3333")),

  /** Origens permitidas pelo CORS (separadas por vírgula no .env) */
  CORS_ORIGIN: optionalEnv("CORS_ORIGIN", "http://localhost:5173"),

  /** URL de conexão com o banco de dados */
  DATABASE_URL: requireEnv("DATABASE_URL"),

  /** Secret para assinatura do Access Token JWT (curta duração — 15 min) */
  JWT_ACCESS_SECRET: requireEnv("JWT_ACCESS_SECRET"),

  /** Secret para assinatura do Refresh Token JWT (longa duração — 7 dias) */
  JWT_REFRESH_SECRET: requireEnv("JWT_REFRESH_SECRET"),

  /** Tempo de expiração do Access Token (padrão: 15 minutos) */
  JWT_ACCESS_EXPIRES_IN: optionalEnv("JWT_ACCESS_EXPIRES_IN", "15m"),

  /** Tempo de expiração do Refresh Token (padrão: 7 dias) */
  JWT_REFRESH_EXPIRES_IN: optionalEnv("JWT_REFRESH_EXPIRES_IN", "7d"),

  /** Secret para assinatura de cookies (HMAC) */
  COOKIE_SECRET: requireEnv("COOKIE_SECRET"),

  /** Helpers */
  isDev: NODE_ENV === "development",
  isProd: NODE_ENV === "production",
  isTest: NODE_ENV === "test",
} as const;
