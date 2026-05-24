import type { RowDataPacket } from "mysql2";
import { pool } from "../../infra/database";
import { mapRow } from "../../infra/database/helpers";
import type { User, RefreshToken } from "../../types/models";
import { nowSP } from "../../shared/utils/date";

export function createAuthRepository() {
  return {
    async findUserByUsername(username: string): Promise<User | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM `user` WHERE username = ? AND deleted_at IS NULL LIMIT 1",
        [username],
      );
      return rows[0] ? mapRow<User>(rows[0]) : null;
    },

    async findUserById(id: string) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, username, professional_name, role, professional_id,
                workday_start, workday_end, created_at
         FROM \`user\` WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
        [id],
      );
      if (!rows[0]) return null;
      const r = rows[0];
      return {
        id:               r["id"] as string,
        username:         r["username"] as string,
        professionalName: r["professional_name"] as string | null,
        role:             r["role"] as string,
        professionalId:   r["professional_id"] as string | null,
        workdayStart:     r["workday_start"] as string,
        workdayEnd:       r["workday_end"] as string,
        createdAt:        r["created_at"] as Date,
      };
    },

    async findUserByIdFull(id: string): Promise<User | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM `user` WHERE id = ? AND deleted_at IS NULL LIMIT 1",
        [id],
      );
      return rows[0] ? mapRow<User>(rows[0]) : null;
    },

    async findProfessionalAdminId(professionalId: string) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT admin_id FROM professional WHERE id = ? LIMIT 1",
        [professionalId],
      );
      if (!rows[0]) return null;
      return { adminId: rows[0]["admin_id"] as string };
    },

    async createUser(data: {
      id: string;
      username: string;
      passwordHash: string;
      professionalName: string | null;
    }): Promise<User> {
      await pool.execute(
        `INSERT INTO \`user\` (id, username, password_hash, professional_name)
         VALUES (?, ?, ?, ?)`,
        [data.id, data.username, data.passwordHash, data.professionalName],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM `user` WHERE id = ? LIMIT 1",
        [data.id],
      );
      return mapRow<User>(rows[0]!);
    },

    async updateUserPassword(id: string, passwordHash: string): Promise<void> {
      await pool.execute(
        "UPDATE `user` SET password_hash = ? WHERE id = ?",
        [passwordHash, id],
      );
    },

    async updateWorkingHours(id: string, workdayStart: string, workdayEnd: string) {
      await pool.execute(
        "UPDATE `user` SET workday_start = ?, workday_end = ? WHERE id = ?",
        [workdayStart, workdayEnd, id],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, username, professional_name, role, professional_id,
                workday_start, workday_end, created_at
         FROM \`user\` WHERE id = ? LIMIT 1`,
        [id],
      );
      const r = rows[0]!;
      return {
        id:               r["id"] as string,
        username:         r["username"] as string,
        professionalName: r["professional_name"] as string | null,
        workdayStart:     r["workday_start"] as string,
        workdayEnd:       r["workday_end"] as string,
        createdAt:        r["created_at"] as Date,
      };
    },

    async createRefreshToken(data: {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    }): Promise<RefreshToken> {
      // Mantém apenas 1 token ativo por usuário
      await pool.execute("DELETE FROM refresh_token WHERE user_id = ?", [data.userId]);
      await pool.execute(
        "INSERT INTO refresh_token (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
        [data.id, data.userId, data.tokenHash, data.expiresAt],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM refresh_token WHERE id = ? LIMIT 1",
        [data.id],
      );
      return mapRow<RefreshToken>(rows[0]!);
    },

    async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM refresh_token WHERE token_hash = ? LIMIT 1",
        [tokenHash],
      );
      return rows[0] ? mapRow<RefreshToken>(rows[0]) : null;
    },

    async revokeRefreshToken(id: string): Promise<void> {
      await pool.execute(
        "UPDATE refresh_token SET revoked_at = ? WHERE id = ?",
        [nowSP(), id],
      );
    },

    async revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
      await pool.execute(
        "UPDATE refresh_token SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL",
        [nowSP(), tokenHash],
      );
    },

    async revokeAllUserRefreshTokens(userId: string): Promise<void> {
      await pool.execute(
        "UPDATE refresh_token SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
        [nowSP(), userId],
      );
    },
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
