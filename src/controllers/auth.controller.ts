import type { Request, Response, CookieOptions } from "express";
import {
  login,
  getAuthenticatedUser,
  register,
  changePassword,
  updateWorkingHours,
} from "../services/auth.service";
import { generateCsrfToken } from "../middlewares/csrf.middleware";
import { env } from "../configs";

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: (env.isProd ? "none" : "strict") as "none" | "strict",
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
 * POST /api/auth/register
 */
const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { username, password, professionalName } = req.body as {
    username?: string;
    password?: string;
    professionalName?: string | null;
  };

  if (!username || !password) {
    res
      .status(400)
      .json({ status: "error", message: "Username e senha são obrigatórios" });
    return;
  }

  try {
    const result = await register(username, password, professionalName ?? null);

    if (!result) {
      res
        .status(409)
        .json({ status: "error", message: "Username já está em uso" });
      return;
    }

    const csrfToken = generateCsrfToken(req, res);

    res.cookie("token", result.token, COOKIE_OPTIONS);

    res
      .status(201)
      .json({ status: "ok", data: { user: result.user, csrfToken } });
  } catch (err) {
    // Se ocorrer erro de constraint do Prisma, o middleware global de erro irá
    // normalizar para a resposta apropriada. Aqui retornamos 500 genérico.
    res.status(500).json({ status: "error", message: "Erro ao criar usuário" });
  }
};

/**
 * POST /api/auth/logout
 */
const logoutController = (_req: Request, res: Response): void => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: (env.isProd ? "none" : "strict") as "none" | "strict",
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

export { loginController, logoutController, meController, registerUser };

/**
 * PATCH /api/auth/password
 */
const changePasswordController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ status: "error", message: "Não autenticado" });
    return;
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      status: "error",
      message: "Senha atual e nova senha são obrigatórias",
    });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      status: "error",
      message: "A nova senha deve ter pelo menos 6 caracteres",
    });
    return;
  }

  const success = await changePassword(userId, currentPassword, newPassword);

  if (!success) {
    res.status(400).json({
      status: "error",
      message: "Senha atual incorreta",
    });
    return;
  }

  res.status(200).json({ status: "ok", message: "Senha alterada com sucesso" });
};

/**
 * PATCH /api/auth/working-hours
 */
const updateWorkingHoursController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ status: "error", message: "Não autenticado" });
    return;
  }

  const { workdayStart, workdayEnd } = req.body as {
    workdayStart?: string;
    workdayEnd?: string;
  };

  if (!workdayStart || !workdayEnd) {
    res.status(400).json({
      status: "error",
      message: "Horário de início e fim do expediente são obrigatórios",
    });
    return;
  }

  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timeRegex.test(workdayStart) || !timeRegex.test(workdayEnd)) {
    res.status(400).json({
      status: "error",
      message: "Formato de horário inválido. Use HH:mm",
    });
    return;
  }

  if (workdayStart >= workdayEnd) {
    res.status(400).json({
      status: "error",
      message: "O horário de início deve ser anterior ao de término",
    });
    return;
  }

  const user = await updateWorkingHours(userId, workdayStart, workdayEnd);
  res.status(200).json({ status: "ok", data: user });
};

export { changePasswordController, updateWorkingHoursController };
