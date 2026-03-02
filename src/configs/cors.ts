import type { CorsOptions } from "cors";
import { env } from "./env";

/**
 * Configuração de CORS.
 *
 * Em desenvolvimento: aceita todas as origens definidas em CORS_ORIGIN.
 * Em produção: aceita apenas as origens definidas em CORS_ORIGIN (sem wildcard).
 */

const parseOrigins = (): string[] => {
  return env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
};

export const corsOptions: CorsOptions = {
  origin: env.isDev
    ? true // Em dev aceita qualquer origem para facilitar o desenvolvimento
    : parseOrigins(), // Em prod aceita apenas origens explícitas
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // Cache preflight por 24h
};
