import type { RowDataPacket } from "mysql2";
import { pool } from "../../infra/database";
import { mapRow, buildSet } from "../../infra/database/helpers";
import type { Pathology } from "../../types/models";

export function createPathologyRepository() {
  return {
    async findById(id: string): Promise<Pathology | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM pathologies WHERE id = ? LIMIT 1",
        [id],
      );
      return rows[0] ? mapRow<Pathology>(rows[0]) : null;
    },

    async findMany(): Promise<Pathology[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM pathologies ORDER BY name ASC",
      );
      return rows.map((r) => mapRow<Pathology>(r));
    },

    async create(data: { id: string; name: string; description: string | null }): Promise<Pathology> {
      await pool.execute(
        "INSERT INTO pathologies (id, name, description) VALUES (?, ?, ?)",
        [data.id, data.name, data.description],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM pathologies WHERE id = ? LIMIT 1",
        [data.id],
      );
      return mapRow<Pathology>(rows[0]!);
    },

    async update(id: string, data: Record<string, unknown>): Promise<Pathology> {
      const { clause, values } = buildSet(data);
      if (clause) {
        await pool.execute(
          `UPDATE pathologies SET ${clause} WHERE id = ?`,
          [...values, id],
        );
      }
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM pathologies WHERE id = ? LIMIT 1",
        [id],
      );
      return mapRow<Pathology>(rows[0]!);
    },

    async delete(id: string): Promise<Pathology> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM pathologies WHERE id = ? LIMIT 1",
        [id],
      );
      await pool.execute("DELETE FROM pathologies WHERE id = ?", [id]);
      return mapRow<Pathology>(rows[0]!);
    },
  };
}

export type PathologyRepository = ReturnType<typeof createPathologyRepository>;
