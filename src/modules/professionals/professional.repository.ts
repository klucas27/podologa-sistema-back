import type { RowDataPacket } from "mysql2";
import { pool, withTransaction } from "../../infra/database";
import { mapRow, buildSet } from "../../infra/database/helpers";
import type { Professional, User } from "../../types/models";
import { nowSP } from "../../shared/utils/date";

export function createProfessionalRepository() {
  return {
    async findById(id: string, adminId: string): Promise<Professional | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM professional WHERE id = ? AND admin_id = ? AND deleted_at IS NULL LIMIT 1",
        [id, adminId],
      );
      return rows[0] ? mapRow<Professional>(rows[0]) : null;
    },

    async findUserByUsername(username: string): Promise<User | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM `user` WHERE username = ? AND deleted_at IS NULL LIMIT 1",
        [username],
      );
      return rows[0] ? mapRow<User>(rows[0]) : null;
    },

    async findMany(adminId: string, search?: string): Promise<Professional[]> {
      const params: (string | number)[] = [adminId];
      let extra = "";
      if (search) {
        extra = " AND (full_name LIKE ? OR phone_number LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM professional WHERE admin_id = ? AND deleted_at IS NULL${extra} ORDER BY full_name ASC`,
        params,
      );
      return rows.map((r) => mapRow<Professional>(r));
    },

    async findActive(adminId: string): Promise<Professional[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM professional WHERE admin_id = ? AND deleted_at IS NULL AND is_active = 1 ORDER BY full_name ASC",
        [adminId],
      );
      return rows.map((r) => mapRow<Professional>(r));
    },

    async create(data: Omit<Professional, "isActive" | "createdAt" | "updatedAt" | "deletedAt"> & { isActive?: boolean }): Promise<Professional> {
      await pool.execute(
        `INSERT INTO professional (id, admin_id, full_name, specialty, phone_number, email, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.id, data.adminId, data.fullName, data.specialty ?? null,
         data.phoneNumber ?? null, data.email ?? null, (data.isActive ?? true) ? 1 : 0],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM professional WHERE id = ? LIMIT 1",
        [data.id],
      );
      return mapRow<Professional>(rows[0]!);
    },

    async createWithUser(
      profData: Omit<Professional, "isActive" | "createdAt" | "updatedAt" | "deletedAt"> & { isActive?: boolean },
      userData: { id: string; username: string; passwordHash: string; professionalName: string | null },
    ): Promise<Professional> {
      return withTransaction(async (conn) => {
        await conn.execute(
          `INSERT INTO professional (id, admin_id, full_name, specialty, phone_number, email, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [profData.id, profData.adminId, profData.fullName, profData.specialty ?? null,
           profData.phoneNumber ?? null, profData.email ?? null, (profData.isActive ?? true) ? 1 : 0],
        );
        await conn.execute(
          `INSERT INTO \`user\` (id, username, password_hash, professional_name, role, professional_id)
           VALUES (?, ?, ?, ?, 'professional', ?)`,
          [userData.id, userData.username, userData.passwordHash, userData.professionalName, profData.id],
        );
        const [rows] = await conn.execute<RowDataPacket[]>(
          "SELECT * FROM professional WHERE id = ? LIMIT 1",
          [profData.id],
        );
        return mapRow<Professional>((rows as RowDataPacket[])[0]!);
      });
    },

    async update(id: string, data: Record<string, unknown>): Promise<Professional> {
      const { clause, values } = buildSet(data);
      if (clause) {
        await pool.execute(
          `UPDATE professional SET ${clause} WHERE id = ?`,
          [...values, id],
        );
      }
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM professional WHERE id = ? LIMIT 1",
        [id],
      );
      return mapRow<Professional>(rows[0]!);
    },

    async softDelete(id: string): Promise<Professional> {
      await pool.execute(
        "UPDATE professional SET deleted_at = ? WHERE id = ?",
        [nowSP(), id],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM professional WHERE id = ? LIMIT 1",
        [id],
      );
      return mapRow<Professional>(rows[0]!);
    },
  };
}

export type ProfessionalRepository = ReturnType<typeof createProfessionalRepository>;
