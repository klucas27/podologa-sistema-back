import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authLimiter } from "../middlewares/rateLimit.middleware";

const authRouter = Router();

/**
 * POST /api/auth/login
 * Autentica o usuário e retorna JWT em cookie HTTP-only.
 */
authRouter.post("/login", authLimiter, loginController);

/**
 * POST /api/auth/logout
 * Remove o cookie de autenticação.
 */
authRouter.post("/logout", logoutController);

/**
 * GET /api/auth/me
 * Retorna os dados do usuário autenticado.
 */
authRouter.get("/me", authMiddleware, meController);

export { authRouter };
