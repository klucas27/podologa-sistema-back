import type { CorsOptions } from "cors";
import { env } from "./env";

const DEV_ORIGINS: readonly string[] = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://3593-179-97-64-219.ngrok-free.app/",
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
