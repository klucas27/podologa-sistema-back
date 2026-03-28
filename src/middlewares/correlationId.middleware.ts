import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export function correlationId(req: Request, _res: Response, next: NextFunction): void {
  const id =
    (req.headers["x-correlation-id"] as string | undefined) ??
    crypto.randomUUID();
  req.correlationId = id;
  next();
}
