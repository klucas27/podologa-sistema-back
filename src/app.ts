import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";

import { env, corsOptions, helmetOptions } from "./configs";
import { router } from "./routes";
import { errorHandler, notFound, globalLimiter } from "./middlewares";

/**
 * Cria e configura a instância do Express.
 */
const createApp = (): express.Express => {
  const app = express();

  // ── Trust proxy (necessário atrás de reverse proxy) ─
  app.set("trust proxy", 1);

  // ── Desabilitar x-powered-by ───────────────────────
  app.disable("x-powered-by");

  // ── Segurança — Helmet (headers) ───────────────────
  app.use(helmet(helmetOptions));

  // ── CORS ───────────────────────────────────────────
  app.use(cors(corsOptions));

  // ── Rate Limit Global ──────────────────────────────
  app.use(globalLimiter);

  // ── Cookie Parser (signed cookies) ─────────────────
  app.use(cookieParser(env.COOKIE_SECRET));

  // ── Parsing ────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // ── Compressão ─────────────────────────────────────
  app.use(compression());

  // ── Logs HTTP ──────────────────────────────────────
  if (env.isDev) {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // ── Rotas ──────────────────────────────────────────
  app.use("/api", router);

  // ── 404 & Error Handler ────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export { createApp };
