import type { PrismaClient, User, RefreshToken } from "@prisma/client";

export function createAuthRepository(prisma: PrismaClient) {
  return {
    findUserByUsername(username: string) {
      return prisma.user.findUnique({ where: { username } });
    },

    findUserById(id: string) {
      return prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          professionalName: true,
          workdayStart: true,
          workdayEnd: true,
          createdAt: true,
        },
      });
    },

    findUserByIdFull(id: string): Promise<User | null> {
      return prisma.user.findUnique({ where: { id } });
    },

    createUser(data: {
      id: string;
      username: string;
      passwordHash: string;
      professionalName: string | null;
    }): Promise<User> {
      return prisma.user.create({ data });
    },

    updateUserPassword(id: string, passwordHash: string) {
      return prisma.user.update({
        where: { id },
        data: { passwordHash },
      });
    },

    updateWorkingHours(id: string, workdayStart: string, workdayEnd: string) {
      return prisma.user.update({
        where: { id },
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
    },

    createRefreshToken(data: {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    }): Promise<RefreshToken> {
      return prisma.refreshToken.create({ data });
    },

    findRefreshTokenByHash(tokenHash: string) {
      return prisma.refreshToken.findUnique({ where: { tokenHash } });
    },

    revokeRefreshToken(id: string) {
      return prisma.refreshToken.update({
        where: { id },
        data: { revokedAt: new Date() },
      });
    },

    revokeRefreshTokenByHash(tokenHash: string) {
      return prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },

    revokeAllUserRefreshTokens(userId: string) {
      return prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
