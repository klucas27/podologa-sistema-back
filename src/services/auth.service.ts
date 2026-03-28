import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib";
import { env } from "../configs";

// ── Types ───────────────────────────────────────────────────

interface TokenPayload {
  userId: string;
  username: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResult {
  tokens: AuthTokens;
  user: {
    id: string;
    username: string;
    professionalName: string | null;
  };
}

// ── Token helpers (internos) ────────────────────────────────

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

function generateRefreshTokenJwt(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Salva o hash do refresh token no banco para possibilitar revogação. */
async function persistRefreshToken(
  userId: string,
  rawToken: string,
): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  await prisma.refreshToken.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt,
    },
  });
}

/** Gera par access + refresh e persiste o refresh no banco. */
async function issueTokenPair(payload: TokenPayload): Promise<AuthTokens> {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshTokenJwt(payload);
  await persistRefreshToken(payload.userId, refreshToken);
  return { accessToken, refreshToken };
}

// ── Public API ──────────────────────────────────────────────

/**
 * Autentica o usuário por username + senha.
 * Retorna par de tokens (access 15min + refresh 7d) e dados públicos.
 */
const login = async (
  username: string,
  password: string,
): Promise<LoginResult | null> => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.deletedAt) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const tokens = await issueTokenPair({
    userId: user.id,
    username: user.username,
  });

  return {
    tokens,
    user: {
      id: user.id,
      username: user.username,
      professionalName: user.professionalName,
    },
  };
};

/**
 * Registra novo usuário e já emite tokens.
 */
const register = async (
  username: string,
  password: string,
  professionalName?: string | null,
): Promise<LoginResult | null> => {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return null;

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      professionalName: professionalName ?? null,
    },
  });

  const tokens = await issueTokenPair({
    userId: user.id,
    username: user.username,
  });

  return {
    tokens,
    user: {
      id: user.id,
      username: user.username,
      professionalName: user.professionalName,
    },
  };
};

/**
 * Rotação de Refresh Token.
 *
 * 1. Verifica a assinatura JWT do token antigo.
 * 2. Busca o hash no banco — se já revogado, revoga TODOS os tokens
 *    do usuário (detecção de reuso = possível roubo).
 * 3. Revoga o token antigo e emite um novo par.
 */
const rotateRefreshToken = async (
  oldRawToken: string,
): Promise<AuthTokens | null> => {
  let payload: TokenPayload;
  try {
    payload = jwt.verify(
      oldRawToken,
      env.JWT_REFRESH_SECRET,
    ) as TokenPayload;
  } catch {
    return null;
  }

  const oldHash = hashToken(oldRawToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: oldHash },
  });

  if (!stored || stored.revokedAt) {
    // Token reuse detected → revoke ALL user tokens (possible theft)
    await prisma.refreshToken.updateMany({
      where: { userId: payload.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  if (stored.expiresAt < new Date()) {
    return null;
  }

  // Revoga o token antigo
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  // Emite novo par
  return issueTokenPair({
    userId: payload.userId,
    username: payload.username,
  });
};

/**
 * Revoga um refresh token específico (logout).
 */
const revokeRefreshToken = async (rawToken: string): Promise<void> => {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

/**
 * Revoga todos os refresh tokens de um usuário (troca de senha).
 */
const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

/**
 * Busca o usuário autenticado pelo ID (sem campos sensíveis).
 */
const getAuthenticatedUser = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      professionalName: true,
      workdayStart: true,
      workdayEnd: true,
      createdAt: true,
    },
  });
};

/**
 * Altera a senha do usuário, revogando TODAS as sessões ativas.
 */
const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) return false;

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return false;

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Invalida todas as sessões — force re-login
  await revokeAllUserRefreshTokens(userId);

  return true;
};

/**
 * Atualiza o horário de expediente do usuário.
 */
const updateWorkingHours = async (
  userId: string,
  workdayStart: string,
  workdayEnd: string,
) => {
  return prisma.user.update({
    where: { id: userId },
    data: { workdayStart, workdayEnd },
    select: {
      id: true,
      username: true,
      professionalName: true,
      workdayStart: true,
      workdayEnd: true,
      createdAt: true,
    },
  });
};

export {
  login,
  register,
  rotateRefreshToken,
  revokeRefreshToken,
  getAuthenticatedUser,
  changePassword,
  updateWorkingHours,
};
