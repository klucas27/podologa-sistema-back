import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";

import { env, corsOptions, helmetOptions } from "./config";
import { router } from "./modules";
import { errorHandler, notFound, apiLimiter, correlationId } from "./middlewares";

const CLIENT_DIR = path.join(__dirname, "client");

const createApp = (): express.Express => {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(compression());
  app.use(correlationId);

  app.use("/api", apiLimiter, router);
  app.use("/api", notFound);

  app.use(express.static(CLIENT_DIR));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIR, "index.html"));
  });

  app.use(errorHandler);

  return app;
};

export { createApp };
