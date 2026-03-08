import type { Request, Response } from "express";
import { login, getAuthenticatedUser } from "../services/auth.service";
import { generateCsrfToken } from "../middlewares/csrf.middleware";
import { env } from "../configs";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "strict" as const,
  signed: true,
  maxAge: 24 * 60 * 60 * 1000, // 1 dia
};

/**
 * POST /api/auth/login
 */
const loginController = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res.status(400).json({
      status: "error",
      message: "Username e senha são obrigatórios",
    });
    return;
  }

  const result = await login(username, password);

  if (!result) {
    res.status(401).json({
      status: "error",
      message: "Credenciais inválidas",
    });
    return;
  }

  const csrfToken = generateCsrfToken(req, res);

  res.cookie("token", result.token, COOKIE_OPTIONS);

  res.status(200).json({
    status: "ok",
    data: {
      user: result.user,
      csrfToken,
    },
  });
};

/**
 * POST /api/auth/logout
 */
const logoutController = (_req: Request, res: Response): void => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "strict" as const,
    signed: true,
  });

  res.status(200).json({
    status: "ok",
    message: "Logout realizado com sucesso",
  });
};

/**
 * GET /api/auth/me
 */
const meController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      status: "error",
      message: "Não autenticado",
    });
    return;
  }

  const user = await getAuthenticatedUser(userId);

  if (!user) {
    res.status(404).json({
      status: "error",
      message: "Usuário não encontrado",
    });
    return;
  }

  res.status(200).json({
    status: "ok",
    data: user,
  });
};

export { loginController, logoutController, meController };
