import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { AuthRepository } from "./auth.repository";
import type { Env } from "../../config/env";
import { AuthError, ConflictError } from "../../shared/errors";
import { nowSP } from "../../shared/utils/date";

interface TokenPayload {
  userId: string;
  username: string;
  role: "admin" | "professional";
  professionalId: string | null;
  adminId: string;
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
    adminId: string;
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
    const expiresAt = new Date(nowSP().getTime() + 7 * 24 * 60 * 60 * 1000);
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

      // Resolve adminId: admin owns their own data, professional inherits from their Professional record
      let adminId = user.id;
      if (user.role === "professional" && user.professionalId) {
        const prof = await repo.findProfessionalAdminId(user.professionalId);
        if (prof) adminId = prof.adminId;
      }

      const tokens = await issueTokenPair({
        userId: user.id,
        username: user.username,
        role: user.role,
        professionalId: user.professionalId,
        adminId,
      });

      return {
        tokens,
        user: {
          id: user.id,
          username: user.username,
          professionalName: user.professionalName,
          role: user.role,
          professionalId: user.professionalId,
          adminId,
        },
      };
    },

    async register(
      username: string,
      password: string,
      professionalName: string | null,
    ): Promise<LoginResult> {
      const existing = await repo.findUserByUsername(username);
      if (existing) throw new ConflictError("Username já está em uso");

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await repo.createUser({
        id: crypto.randomUUID(),
        username,
        passwordHash,
        professionalName,
      });

      const tokens = await issueTokenPair({
        userId: user.id,
        username: user.username,
        role: user.role,
        professionalId: user.professionalId,
        adminId: user.id, // New users are always admin
      });

      return {
        tokens,
        user: {
          id: user.id,
          username: user.username,
          professionalName: user.professionalName,
          role: user.role,
          professionalId: user.professionalId,
          adminId: user.id,
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

      if (stored.expiresAt < nowSP()) {
        throw new AuthError("Refresh token expirado");
      }

      await repo.revokeRefreshToken(stored.id);

      // Fetch fresh user data for the new token pair
      const user = await repo.findUserByIdFull(payload.userId);
      if (!user || user.deletedAt) throw new AuthError("Usuário não encontrado");

      let adminId = user.id;
      if (user.role === "professional" && user.professionalId) {
        const prof = await repo.findProfessionalAdminId(user.professionalId);
        if (prof) adminId = prof.adminId;
      }

      return issueTokenPair({
        userId: user.id,
        username: user.username,
        role: user.role,
        professionalId: user.professionalId,
        adminId,
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
