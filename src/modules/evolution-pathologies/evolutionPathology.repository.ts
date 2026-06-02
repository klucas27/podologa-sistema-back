import type { RowDataPacket } from "mysql2";
import { pool } from "../../infra/database";
import { mapRow, buildSet } from "../../infra/database/helpers";
import type { EvolutionPathology, BodyPart, Pathology } from "../../types/models";

export interface EvolutionPathologyKey {
  evolutionId: string;
  pathologyId: string;
  bodyPart: BodyPart;
}

async function attachPathology(ep: EvolutionPathology): Promise<EvolutionPathology> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM pathologies WHERE id = ? LIMIT 1",
    [ep.pathologyId],
  );
  if (rows[0]) ep.pathology = mapRow<Pathology>(rows[0]);
  return ep;
}

export function createEvolutionPathologyRepository() {
  return {
    async findByKey(key: EvolutionPathologyKey, adminId: string): Promise<EvolutionPathology | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT ep.* FROM evolution_pathologies ep
         JOIN clinical_evolutions ce ON ce.id = ep.evolution_id
         JOIN appointments a ON a.id = ce.appointment_id
         JOIN patient p ON p.id = a.patient_id
         WHERE ep.evolution_id = ? AND ep.pathology_id = ? AND ep.body_part = ?
           AND p.admin_id = ? LIMIT 1`,
        [key.evolutionId, key.pathologyId, key.bodyPart, adminId],
      );
      if (!rows[0]) return null;
      return attachPathology(mapRow<EvolutionPathology>(rows[0]));
    },

    async findByEvolution(evolutionId: string, adminId: string): Promise<EvolutionPathology[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT ep.*, pt.id AS path_id, pt.name AS path_name, pt.description AS path_description,
                pt.created_at AS path_createdAt, pt.updated_at AS path_updatedAt
         FROM evolution_pathologies ep
         JOIN clinical_evolutions ce ON ce.id = ep.evolution_id
         JOIN appointments a ON a.id = ce.appointment_id
         JOIN patient p ON p.id = a.patient_id
         JOIN pathologies pt ON pt.id = ep.pathology_id
         WHERE ep.evolution_id = ? AND p.admin_id = ?
         ORDER BY ep.created_at ASC`,
        [evolutionId, adminId],
      );
      return rows.map((r) => {
        const ep = mapRow<EvolutionPathology>(r);
        ep.pathology = {
          id:          r["path_id"] as string,
          name:        r["path_name"] as string,
          description: r["path_description"] as string | null,
          createdAt:   r["path_createdAt"] as Date,
          updatedAt:   r["path_updatedAt"] as Date,
        };
        return ep;
      });
    },

    async existsEvolutionForAdmin(evolutionId: string, adminId: string): Promise<boolean> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 1 FROM clinical_evolutions ce
         JOIN appointments a ON a.id = ce.appointment_id
         JOIN patient p ON p.id = a.patient_id
         WHERE ce.id = ? AND ce.deleted_at IS NULL AND p.admin_id = ? LIMIT 1`,
        [evolutionId, adminId],
      );
      return (rows as RowDataPacket[]).length > 0;
    },

    async create(data: {
      evolutionId: string;
      pathologyId: string;
      bodyPart: BodyPart;
      notes: string | null;
    }): Promise<EvolutionPathology> {
      await pool.execute(
        `INSERT INTO evolution_pathologies (evolution_id, pathology_id, body_part, notes)
         VALUES (?, ?, ?, ?)`,
        [data.evolutionId, data.pathologyId, data.bodyPart, data.notes],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM evolution_pathologies
         WHERE evolution_id = ? AND pathology_id = ? AND body_part = ? LIMIT 1`,
        [data.evolutionId, data.pathologyId, data.bodyPart],
      );
      return mapRow<EvolutionPathology>(rows[0]!);
    },

    async update(key: EvolutionPathologyKey, data: Record<string, unknown>): Promise<EvolutionPathology> {
      const { clause, values } = buildSet(data);
      if (clause) {
        await pool.execute(
          `UPDATE evolution_pathologies SET ${clause}
           WHERE evolution_id = ? AND pathology_id = ? AND body_part = ?`,
          [...values, key.evolutionId, key.pathologyId, key.bodyPart],
        );
      }
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM evolution_pathologies
         WHERE evolution_id = ? AND pathology_id = ? AND body_part = ? LIMIT 1`,
        [key.evolutionId, key.pathologyId, key.bodyPart],
      );
      return mapRow<EvolutionPathology>(rows[0]!);
    },

    async delete(key: EvolutionPathologyKey): Promise<EvolutionPathology> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM evolution_pathologies
         WHERE evolution_id = ? AND pathology_id = ? AND body_part = ? LIMIT 1`,
        [key.evolutionId, key.pathologyId, key.bodyPart],
      );
      await pool.execute(
        `DELETE FROM evolution_pathologies
         WHERE evolution_id = ? AND pathology_id = ? AND body_part = ?`,
        [key.evolutionId, key.pathologyId, key.bodyPart],
      );
      return mapRow<EvolutionPathology>(rows[0]!);
    },
  };
}

export type EvolutionPathologyRepository = ReturnType<typeof createEvolutionPathologyRepository>;
