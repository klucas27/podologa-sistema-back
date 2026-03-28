import { Router } from "express";
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

export function createAuthRoutes(ctrl: AuthController): Router {
  const router = Router();

  router.post("/login", loginLimiter, validate({ body: loginSchema }), ctrl.login);
  router.post("/register", loginLimiter, validate({ body: registerSchema }), ctrl.register);
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
