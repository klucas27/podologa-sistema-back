import { Router } from "express";
import type { RequestHandler } from "express";
import type { AuthController } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware";
import { loginLimiter, validate } from "../../middlewares";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateWorkingHoursSchema,
} from "./auth.schema";
import type { Env } from "../../config/env";

export function createAuthRoutes(ctrl: AuthController, envConfig: Env): Router {
  const router = Router();

  router.get("/registration-status", (_req, res) => {
    res
      .status(200)
      .json({
        status: "ok",
        data: { enabled: envConfig.REGISTRATION_ENABLED },
      });
  });

  const registrationGuard: RequestHandler = (_req, res, next) => {
    if (!envConfig.REGISTRATION_ENABLED) {
      res.status(403).json({ message: "Registro desabilitado neste ambiente" });
      return;
    }
    next();
  };

  router.post(
    "/login",
    loginLimiter,
    validate({ body: loginSchema }),
    ctrl.login,
  );
  router.post(
    "/register",
    registrationGuard,
    loginLimiter,
    validate({ body: registerSchema }),
    ctrl.register,
  );
  router.post("/refresh", loginLimiter, ctrl.refresh);
  router.post("/logout", ctrl.logout);

  router.get("/me", authMiddleware, ctrl.me);
  router.patch(
    "/password",
    authMiddleware,
    doubleCsrfProtection,
    validate({ body: changePasswordSchema }),
    ctrl.changePassword,
  );
  router.patch(
    "/working-hours",
    authMiddleware,
    doubleCsrfProtection,
    validate({ body: updateWorkingHoursSchema }),
    ctrl.updateWorkingHours,
  );

  return router;
}
