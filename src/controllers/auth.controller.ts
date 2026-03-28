import type { Request, Response, CookieOptions } from "express";
import {
  login,
  register,
  rotateRefreshToken,
  revokeRefreshToken,
  getAuthenticatedUser,
  changePassword,
  updateWorkingHours,
} from "../services/auth.service";
import { generateCsrfToken } from "../middlewares/csrf.middleware";
import { env } from "../configs";

// ── Cookie options ──────────────────────────────────────────
//
// HttpOnly: impede leitura via document.cookie → mitiga XSS token theft
// Secure: cookie só trafega em HTTPS → mitiga interceptação em HTTP
// SameSite=Strict: cookie NUNCA enviado em requisições cross-site → mitiga CSRF
// signed: HMAC do valor do cookie → detecta tampering
//
// O access_token tem path=/ (enviado em todas as rotas da API).
// O refresh_token tem path=/api/auth (enviado apenas em rotas de auth),
// reduzindo a superfície de exposição.

const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "strict",
  signed: true,
  maxAge: 15 * 60 * 1000, // 15 minutos
  path: "/",
};

const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "strict",
  signed: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  path: "/api/auth",
};

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);
}

function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "strict",
    signed: true,
    path: "/",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "strict",
    signed: true,
    path: "/api/auth",
  });
}

// ── Controllers ─────────────────────────────────────────────

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

  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
  const csrfToken = generateCsrfToken(req, res);

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

  const result = await register(username, password, professionalName ?? null);

  if (!result) {
    res
      .status(409)
      .json({ status: "error", message: "Username já está em uso" });
    return;
  }

  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
  const csrfToken = generateCsrfToken(req, res);

  res
    .status(201)
    .json({ status: "ok", data: { user: result.user, csrfToken } });
};

/**
 * POST /api/auth/refresh
 *
 * Rotação do refresh token: o token antigo é revogado e um novo par é emitido.
 * Se um token já revogado for reutilizado, TODOS os tokens do usuário são
 * invalidados (detecção de roubo).
 */
const refreshController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const oldRefreshToken = req.signedCookies?.["refresh_token"] as
    | string
    | undefined;

  if (!oldRefreshToken) {
    res.status(401).json({
      status: "error",
      message: "Refresh token ausente",
    });
    return;
  }

  const tokens = await rotateRefreshToken(oldRefreshToken);

  if (!tokens) {
    clearAuthCookies(res);
    res.status(401).json({
      status: "error",
      message: "Refresh token inválido ou expirado. Faça login novamente.",
    });
    return;
  }

  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  const csrfToken = generateCsrfToken(req, res);

  res.status(200).json({
    status: "ok",
    data: { csrfToken },
  });
};

/**
 * POST /api/auth/logout
 *
 * Revoga o refresh token ativo e limpa ambos os cookies.
 */
const logoutController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const refreshToken = req.signedCookies?.["refresh_token"] as
    | string
    | undefined;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  clearAuthCookies(res);

  res.status(200).json({
    status: "ok",
    message: "Logout realizado com sucesso",
  });
};

/**
 * GET /api/auth/me
 *
 * Retorna dados do usuário + novo CSRF token.
 * Essencial no reload da página: o access_token cookie sobrevive ao refresh
 * do browser, mas o csrfToken (armazenado em memória JS) é perdido.
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

  const csrfToken = generateCsrfToken(req, res);

  res.status(200).json({
    status: "ok",
    data: { user, csrfToken },
  });
};

/**
 * PATCH /api/auth/password
 *
 * Altera a senha e revoga TODAS as sessões ativas (force re-login).
 */
const changePasswordController = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

  clearAuthCookies(res);

  res.status(200).json({
    status: "ok",
    message: "Senha alterada com sucesso. Faça login novamente.",
  });
};

/**
 * PATCH /api/auth/working-hours
 */
const updateWorkingHoursController = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

export {
  loginController,
  logoutController,
  meController,
  registerUser,
  refreshController,
  changePasswordController,
  updateWorkingHoursController,
};
