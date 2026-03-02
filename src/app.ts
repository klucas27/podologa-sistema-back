import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import { env, corsOptions } from "./configs";
import { router } from "./routes";
import { errorHandler, notFound } from "./middlewares";

/**
 * Cria e configura a instância do Express.
 */
const createApp = (): express.Express => {
  const app = express();

  // ── Segurança ──────────────────────────────────────
  app.use(helmet());

  // ── CORS ───────────────────────────────────────────
  app.use(cors(corsOptions));

  // ── Parsing ────────────────────────────────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

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
