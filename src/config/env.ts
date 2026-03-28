import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3333),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  COOKIE_SECRET: z.string().min(1, "COOKIE_SECRET is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.flatten().fieldErrors;
  const message = Object.entries(formatted)
    .map(([key, errors]) => `  ${key}: ${(errors ?? []).join(", ")}`)
    .join("\n");

  // Using process.stderr directly — logger may not be initialized yet
  process.stderr.write(`\n[ENV] Invalid environment variables:\n${message}\n\n`);
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  isDev: data.NODE_ENV === "development",
  isProd: data.NODE_ENV === "production",
  isTest: data.NODE_ENV === "test",
} as const;

export type Env = typeof env;
