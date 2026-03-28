import type { Request, Response, NextFunction, CookieOptions } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import { generateCsrfToken } from "../../middlewares/csrf.middleware";
import type { Env } from "../../config/env";
import type { createAuthService } from "./auth.service";

type AuthService = ReturnType<typeof createAuthService>;

export function createAuthController(service: AuthService, envConfig: Env) {
  const ACCESS_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: envConfig.isProd,
    sameSite: "strict",
    signed: true,
    maxAge: 15 * 60 * 1000,
    path: "/",
  };

  const REFRESH_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: envConfig.isProd,
    sameSite: "strict",
    signed: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };

  function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);
  }

  function clearAuthCookies(res: Response): void {
    res.clearCookie("access_token", {
      httpOnly: true, secure: envConfig.isProd, sameSite: "strict", signed: true, path: "/",
    });
    res.clearCookie("refresh_token", {
      httpOnly: true, secure: envConfig.isProd, sameSite: "strict", signed: true, path: "/api/auth",
    });
  }

  return {
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { username, password } = req.body as { username: string; password: string };
        const result = await service.login(username, password);
        setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
        const csrfToken = generateCsrfToken(req, res);
        res.status(200).json({ status: "ok", data: { user: sanitizeOutput(result.user), csrfToken } });
      } catch (err) { next(err); }
    },

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { username, password, professionalName } = req.body as {
          username: string; password: string; professionalName?: string | null;
        };
        const result = await service.register(username, password, professionalName ?? null);
        setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
        const csrfToken = generateCsrfToken(req, res);
        res.status(201).json({ status: "ok", data: { user: sanitizeOutput(result.user), csrfToken } });
      } catch (err) { next(err); }
    },

    async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const oldRefreshToken = req.signedCookies?.["refresh_token"] as string | undefined;
        if (!oldRefreshToken) {
          res.status(401).json({ status: "error", message: "Refresh token ausente" });
          return;
        }
        const tokens = await service.rotateRefreshToken(oldRefreshToken);
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        const csrfToken = generateCsrfToken(req, res);
        res.status(200).json({ status: "ok", data: { csrfToken } });
      } catch (err) {
        clearAuthCookies(res);
        next(err);
      }
    },

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const refreshToken = req.signedCookies?.["refresh_token"] as string | undefined;
        if (refreshToken) {
          await service.revokeRefreshToken(refreshToken);
        }
        clearAuthCookies(res);
        res.status(200).json({ status: "ok", message: "Logout realizado com sucesso" });
      } catch (err) { next(err); }
    },

    async me(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({ status: "error", message: "Não autenticado" });
          return;
        }
        const user = await service.getAuthenticatedUser(userId);
        if (!user) {
          res.status(404).json({ status: "error", message: "Usuário não encontrado" });
          return;
        }
        const csrfToken = generateCsrfToken(req, res);
        res.status(200).json({ status: "ok", data: { user: sanitizeOutput(user), csrfToken } });
      } catch (err) { next(err); }
    },

    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({ status: "error", message: "Não autenticado" });
          return;
        }
        const { currentPassword, newPassword } = req.body as {
          currentPassword: string; newPassword: string;
        };
        await service.changePassword(userId, currentPassword, newPassword);
        clearAuthCookies(res);
        res.status(200).json({ status: "ok", message: "Senha alterada com sucesso. Faça login novamente." });
      } catch (err) { next(err); }
    },

    async updateWorkingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({ status: "error", message: "Não autenticado" });
          return;
        }
        const { workdayStart, workdayEnd } = req.body as {
          workdayStart: string; workdayEnd: string;
        };
        const user = await service.updateWorkingHours(userId, workdayStart, workdayEnd);
        res.status(200).json({ status: "ok", data: sanitizeOutput(user) });
      } catch (err) { next(err); }
    },
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
