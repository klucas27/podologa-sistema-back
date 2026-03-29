import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { AuthRepository } from "./auth.repository";
import type { Env } from "../../config/env";
import { AuthError, ConflictError } from "../../shared/errors";

interface TokenPayload {
  userId: string;
  username: string;
  role: "admin" | "professional";
  adminId: string;
  professionalId: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  tokens: AuthTokens;
  user: {
    id: string;
    username: string;
    professionalName: string | null;
    role: "admin" | "professional";
    professionalId: string | null;
  };
}

export function createAuthService(repo: AuthRepository, envConfig: Env) {
  function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, envConfig.JWT_ACCESS_SECRET, {
      expiresIn: envConfig.JWT_ACCESS_EXPIRES_IN,
    } as SignOptions);
  }

  function generateRefreshTokenJwt(payload: TokenPayload): string {
    return jwt.sign(payload, envConfig.JWT_REFRESH_SECRET, {
      expiresIn: envConfig.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions);
  }

  function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async function persistRefreshToken(userId: string, rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await repo.createRefreshToken({
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt,
    });
  }

  async function issueTokenPair(payload: TokenPayload): Promise<AuthTokens> {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshTokenJwt(payload);
    await persistRefreshToken(payload.userId, refreshToken);
    return { accessToken, refreshToken };
  }

  return {
    async login(username: string, password: string): Promise<LoginResult> {
      const user = await repo.findUserByUsername(username);
      if (!user || user.deletedAt) throw new AuthError("Credenciais inválidas");

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new AuthError("Credenciais inválidas");

      const adminId = user.role === "admin" ? user.id : (user.adminId ?? user.id);

      let professionalId: string | null = null;
      if (user.role === "professional") {
        const professional = await repo.findProfessionalByUserId(user.id);
        if (professional) professionalId = professional.id;
      }

      const tokens = await issueTokenPair({
        userId: user.id,
        username: user.username,
        role: user.role as "admin" | "professional",
        adminId,
        professionalId,
      });

      return {
        tokens,
        user: {
          id: user.id,
          username: user.username,
          professionalName: user.professionalName,
          role: user.role as "admin" | "professional",
          professionalId,
        },
      };
    },

    async register(
      username: string,
      password: string,
    ): Promise<LoginResult> {
      const existing = await repo.findUserByUsername(username);
      if (existing) throw new ConflictError("Username já está em uso");

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await repo.createUser({
        id: crypto.randomUUID(),
        username,
        passwordHash,
        professionalName: null,
        role: "admin",
      });

      const tokens = await issueTokenPair({
        userId: user.id,
        username: user.username,
        role: "admin",
        adminId: user.id,
        professionalId: null,
      });

      return {
        tokens,
        user: {
          id: user.id,
          username: user.username,
          professionalName: user.professionalName,
          role: "admin",
          professionalId: null,
        },
      };
    },

    async rotateRefreshToken(oldRawToken: string): Promise<AuthTokens> {
      let payload: TokenPayload;
      try {
        payload = jwt.verify(oldRawToken, envConfig.JWT_REFRESH_SECRET) as TokenPayload;
      } catch {
        throw new AuthError("Refresh token inválido ou expirado");
      }

      const oldHash = hashToken(oldRawToken);
      const stored = await repo.findRefreshTokenByHash(oldHash);

      if (!stored || stored.revokedAt) {
        await repo.revokeAllUserRefreshTokens(payload.userId);
        throw new AuthError("Refresh token inválido ou expirado. Faça login novamente.");
      }

      if (stored.expiresAt < new Date()) {
        throw new AuthError("Refresh token expirado");
      }

      await repo.revokeRefreshToken(stored.id);

      // Re-fetch user to get current role/adminId in case they changed
      const user = await repo.findUserByIdFull(payload.userId);
      if (!user || user.deletedAt) throw new AuthError("Usuário não encontrado");

      const adminId = user.role === "admin" ? user.id : (user.adminId ?? user.id);

      let professionalId: string | null = null;
      if (user.role === "professional") {
        const professional = await repo.findProfessionalByUserId(user.id);
        if (professional) professionalId = professional.id;
      }

      return issueTokenPair({
        userId: payload.userId,
        username: payload.username,
        role: user.role as "admin" | "professional",
        adminId,
        professionalId,
      });
    },

    async revokeRefreshToken(rawToken: string): Promise<void> {
      const tokenHash = hashToken(rawToken);
      await repo.revokeRefreshTokenByHash(tokenHash);
    },

    getAuthenticatedUser(userId: string) {
      return repo.findUserById(userId);
    },

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
      const user = await repo.findUserByIdFull(userId);
      if (!user || user.deletedAt) throw new AuthError("Usuário não encontrado", 404);

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) throw new AuthError("Senha atual incorreta", 400);

      const newHash = await bcrypt.hash(newPassword, 10);
      await repo.updateUserPassword(userId, newHash);
      await repo.revokeAllUserRefreshTokens(userId);
    },

    updateWorkingHours(userId: string, workdayStart: string, workdayEnd: string) {
      return repo.updateWorkingHours(userId, workdayStart, workdayEnd);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
