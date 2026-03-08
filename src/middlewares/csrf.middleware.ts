import { doubleCsrf } from "csrf-csrf";
import type { Request } from "express";
import { env } from "../configs";

/**
 * Proteção CSRF via double-submit cookie pattern.
 *
 * Gera um token CSRF em um cookie e espera recebê-lo de volta
 * no header X-CSRF-Token em requisições de mutação.
 */
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => env.COOKIE_SECRET,
  getSessionIdentifier: (req: Request) => req.signedCookies?.["token"] ?? "",
  cookieName: "__csrf",
  cookieOptions: {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "strict",
  },
  getCsrfTokenFromRequest: (req: Request) =>
    req.headers["x-csrf-token"] as string,
});

export { doubleCsrfProtection, generateCsrfToken };
