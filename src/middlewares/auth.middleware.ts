import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../configs";

interface JwtPayload {
  userId: string;
  username: string;
}

/**
 * Middleware de autenticação.
 *
 * Lê o JWT do cookie assinado "token", verifica a assinatura
 * e anexa os dados do usuário em req.user.
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.signedCookies?.["token"] as string | undefined;

  if (!token) {
    res.status(401).json({
      status: "error",
      message: "Não autenticado",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch {
    res.status(401).json({
      status: "error",
      message: "Token inválido ou expirado",
    });
  }
};
