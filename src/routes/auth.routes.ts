import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  registerUser,
  refreshController,
  changePasswordController,
  updateWorkingHoursController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { doubleCsrfProtection } from "../middlewares/csrf.middleware";
import { authLimiter } from "../middlewares/rateLimit.middleware";

const authRouter = Router();

// ── Rotas públicas (sem auth, sem CSRF) ──────────────────
authRouter.post("/login", authLimiter, loginController);
authRouter.post("/register", authLimiter, registerUser);

// ── Refresh — rate-limited, sem CSRF (access token expirado) ─
authRouter.post("/refresh", authLimiter, refreshController);

// ── Logout — não exige auth (cookie pode estar expirado) ─
authRouter.post("/logout", logoutController);

// ── Rotas autenticadas + CSRF ────────────────────────────
authRouter.get("/me", authMiddleware, meController);
authRouter.patch(
  "/password",
  authMiddleware,
  doubleCsrfProtection,
  changePasswordController,
);
authRouter.patch(
  "/working-hours",
  authMiddleware,
  doubleCsrfProtection,
  updateWorkingHoursController,
);

export { authRouter };
