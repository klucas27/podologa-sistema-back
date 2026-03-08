import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../lib";
import { env } from "../configs";
import crypto from "crypto";

interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    professionalName: string | null;
  };
}

/**
 * Autentica o usuário por username + senha.
 * Retorna JWT e dados públicos do usuário.
 */
const login = async (
  username: string,
  password: string,
): Promise<LoginResult | null> => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || user.deletedAt) {
    return null;
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordValid) {
    return null;
  }

  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as "1d",
  };

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    env.JWT_SECRET,
    signOptions,
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      professionalName: user.professionalName,
    },
  };
};

/**
 * Busca o usuário autenticado pelo ID (sem campos sensíveis).
 */
const getAuthenticatedUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      professionalName: true,
      createdAt: true,
    },
  });

  return user;
};

export { login, getAuthenticatedUser };

/**
 * Registra um novo usuário (username + password + professionalName?)
 * Retorna o mesmo formato que o login: token + public user fields.
 */
const register = async (
  username: string,
  password: string,
  professionalName?: string | null,
): Promise<LoginResult | null> => {
  // checa existência básica para evitar criar duplicados explicitos
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

  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as "1d",
  };

  const token = jwt.sign({ userId: user.id, username: user.username }, env.JWT_SECRET, signOptions);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      professionalName: user.professionalName,
    },
  };
};

export { register };
