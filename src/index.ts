import { createApp } from "./app";
import { env } from "./configs";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║  🦶 Podóloga Sistema - Backend              ║
  ║  Ambiente : ${env.NODE_ENV.padEnd(30)}  ║
  ║  Porta    : ${String(env.PORT).padEnd(30)}  ║
  ║  Status   : Servidor rodando!               ║
  ╚══════════════════════════════════════════════╝
  `);
});
