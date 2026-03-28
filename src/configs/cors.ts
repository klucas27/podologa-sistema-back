import type { CorsOptions } from "cors";
import { env } from "./env";

/**
 * Configuração de CORS — whitelist EXPLÍCITA, ZERO wildcard.
 *
 * ⚠ RISCO de "origin reflection" com credentials:
 *   Se o servidor copiar o header Origin do request para Access-Control-Allow-Origin
 *   (ex.: origin: true ou callback(null, requestOrigin)), qualquer site pode fazer
 *   requisições autenticadas e LER as respostas — efetivamente anulando a
 *   Same-Origin Policy. Combinado com credentials: true, isso é equivalente a
 *   Access-Control-Allow-Origin: * com cookies, o que os browsers bloqueiam,
 *   mas o reflection burla esse bloqueio.
 *
 *   A proteção correta é validar o origin contra uma whitelist fixa.
 */

const DEV_ORIGINS: readonly string[] = [
  "http://localhost:3000",
  "http://localhost:5173",
];

const parseOrigins = (): string[] => {
  return env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const corsOptions: CorsOptions = {
  origin: env.isDev ? [...DEV_ORIGINS] : parseOrigins(),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  credentials: true,
  maxAge: 86400,
};
