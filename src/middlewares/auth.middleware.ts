import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config";

interface JwtPayload {
  userId: string;
  username: string;
  role?: "admin" | "professional";
  adminId?: string;
  roles?: string[];
  professionalId?: string | null;
}

/**
 * Middleware de autenticação.
 *
 * Lê o JWT do cookie HttpOnly assinado "access_token", verifica a assinatura
 * com JWT_ACCESS_SECRET e anexa os dados do usuário em req.user.
 *
 * O cookie é HttpOnly + Secure + SameSite=Strict + signed, portanto:
 * - Não pode ser lido por JS no browser (mitiga XSS)
 * - Só trafega em HTTPS (mitiga MITM)
 * - Não é enviado em requests cross-site (mitiga CSRF)
 * - Tem HMAC de integridade (detecta tampering)
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.signedCookies?.["access_token"] as string | undefined;

  if (!token) {
    res.status(401).json({
      status: "error",
      message: "Não autenticado",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    const role = decoded.role ?? "admin";
    const adminId = decoded.adminId ?? decoded.userId;

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role,
      adminId,
      roles: decoded.roles ?? [role],
      professionalId: decoded.professionalId ?? null,
    };

    next();
  } catch {
    res.status(401).json({
      status: "error",
      message: "Token inválido ou expirado",
    });
  }
};
