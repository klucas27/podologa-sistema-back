import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import { env, corsOptions, helmetOptions } from "./config";
import { router } from "./modules";
import { errorHandler, notFound, apiLimiter, correlationId } from "./middlewares";

const createApp = (): express.Express => {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.use(apiLimiter);
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(
    express.json({
      limit: "1mb",
      verify: (req: express.Request, _res: express.Response, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(compression());
  app.use(correlationId);

  app.use("/api", router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export { createApp };
