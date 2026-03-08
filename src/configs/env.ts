import dotenv from "dotenv";

dotenv.config();

export const env = {
  /** Ambiente atual: development | production | test */
  NODE_ENV: process.env["NODE_ENV"] || "development",

  /** Porta do servidor */
  PORT: Number(process.env["PORT"]) || 3333,

  /** Origens permitidas pelo CORS (separadas por vírgula no .env) */
  CORS_ORIGIN: process.env["CORS_ORIGIN"] || "http://localhost:5173",

  /** URL de conexão com o banco de dados */
  DATABASE_URL: process.env["DATABASE_URL"] || "",

  /** JWT secret para assinatura de tokens */
  JWT_SECRET: process.env["JWT_SECRET"] || "change-me-in-production",

  /** Tempo de expiração do JWT (ex: "1d", "8h") */
  JWT_EXPIRES_IN: process.env["JWT_EXPIRES_IN"] || "1d",

  /** Secret para assinatura de cookies */
  COOKIE_SECRET: process.env["COOKIE_SECRET"] || "change-me-in-production",

  /** Helpers */
  isDev: (process.env["NODE_ENV"] || "development") === "development",
  isProd: process.env["NODE_ENV"] === "production",
  isTest: process.env["NODE_ENV"] === "test",
} as const;
