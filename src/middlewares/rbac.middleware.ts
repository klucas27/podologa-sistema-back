import type { RequestHandler, Request, Response, NextFunction } from "express";
import { logRbacDenied, logSecurityEvent } from "../infra";

export function checkRole(...allowed: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.userId;

    logSecurityEvent({
      event: "rbac_check",
      userId,
      route: req.originalUrl,
      method: req.method,
      meta: { allowed },
    });

    const role = req.user?.role ?? "";
    const granted = allowed.includes(role);

    if (!granted) {
      logRbacDenied(userId, req.originalUrl, req.method);
      res.status(403).json({ status: "error", message: "Acesso negado" });
      return;
    }

    next();
  };
}
