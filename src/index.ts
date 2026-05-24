import { createApp } from "./app";
import { env } from "./config";
import { logger } from "./infra";
import { runMigrations } from "./infra/database";

async function start() {
  await runMigrations(logger);

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(
      { environment: env.NODE_ENV, port: env.PORT },
      "Podóloga Sistema - Backend rodando",
    );
  });
}

start().catch((err) => {
  logger.error({ err }, "Falha ao iniciar o servidor");
  process.exit(1);
});
