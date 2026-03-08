import type { HelmetOptions } from "helmet";
import { env } from "./env";

/**
 * Configuração customizada do Helmet.
 *
 * - CSP desabilitado em dev para não bloquear frontend local.
 * - crossOriginResourcePolicy permite same-site.
 * - referrerPolicy restrita a same-origin.
 * - x-powered-by removido.
 */
export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: env.isDev ? false : undefined,
  crossOriginResourcePolicy: { policy: "same-site" },
  referrerPolicy: { policy: "same-origin" },
  xPoweredBy: false,
};
