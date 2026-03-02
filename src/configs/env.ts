import dotenv from "dotenv";

dotenv.config();

export const env = {
  /** Ambiente atual: development | production | test */
  NODE_ENV: process.env["NODE_ENV"] || "development",

  /** Porta do servidor */
  PORT: Number(process.env["PORT"]) || 3333,

  /** Origens permitidas pelo CORS (separadas por vírgula no .env) */
  CORS_ORIGIN: process.env["CORS_ORIGIN"] || "http://localhost:5173",

  /** Helpers */
  isDev: (process.env["NODE_ENV"] || "development") === "development",
  isProd: process.env["NODE_ENV"] === "production",
  isTest: process.env["NODE_ENV"] === "test",
} as const;
