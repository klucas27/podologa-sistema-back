import { createApp } from "./app";
import { env } from "./config";
import { logger } from "./infra";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(
    { environment: env.NODE_ENV, port: env.PORT },
    "Podóloga Sistema - Backend rodando",
  );
});
