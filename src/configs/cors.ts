import type { CorsOptions } from "cors";
import { env } from "./env";

/**
 * Configuração de CORS.
 *
 * Em desenvolvimento: aceita origens locais conhecidas.
 * Em produção: aceita apenas as origens definidas em CORS_ORIGIN.
 */

const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:5173"];

const parseOrigins = (): string[] => {
  return env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
};

export const corsOptions: CorsOptions = {
  origin: env.isDev ? DEV_ORIGINS : parseOrigins(),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  credentials: true,
  maxAge: 86400,
};
