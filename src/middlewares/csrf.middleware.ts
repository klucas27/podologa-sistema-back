import { doubleCsrf } from "csrf-csrf";
import type { Request } from "express";
import { env } from "../config";

/**
 * Proteção CSRF via Double Submit Cookie Pattern.
 *
 * O QUÊ: gera um secret em cookie HttpOnly + SameSite=Strict e um token
 *        derivado dele. O client envia o token de volta no header X-CSRF-Token.
 *        O server valida token ↔ secret em cada request de mutação.
 *
 * POR QUÊ: mesmo com SameSite=Strict, é uma camada extra (defense-in-depth).
 *        Previne CSRF caso um browser não suporte SameSite corretamente.
 *
 * VETOR MITIGADO: Cross-Site Request Forgery — um site malicioso submete
 *        formulários/AJAX em nome do usuário autenticado.
 *
 * O sessionIdentifier vincula o CSRF token ao access_token do usuário.
 * Quando o access token é rotacionado (refresh), o novo CSRF token é
 * retornado na resposta de refresh.
 */
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => env.COOKIE_SECRET,
  getSessionIdentifier: (req: Request) =>
    req.signedCookies?.["access_token"] ?? "",
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
