import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  registerUser,
  changePasswordController,
  updateWorkingHoursController,
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
 * POST /api/auth/register
 */
authRouter.post("/register", authLimiter, registerUser);

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

/**
 * PATCH /api/auth/password
 * Altera a senha do usuário autenticado.
 */
authRouter.patch("/password", authMiddleware, changePasswordController);

/**
 * PATCH /api/auth/working-hours
 * Atualiza o horário de expediente do usuário autenticado.
 */
authRouter.patch("/working-hours", authMiddleware, updateWorkingHoursController);

export { authRouter };
