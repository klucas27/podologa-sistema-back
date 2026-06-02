import type { RowDataPacket } from "mysql2";
import { pool } from "../../infra/database";
import { mapRow, buildSet } from "../../infra/database/helpers";
import type { ClinicalEvolution, EvolutionPathology } from "../../types/models";
import { nowSP } from "../../shared/utils/date";

async function attachPathologies(evolutions: ClinicalEvolution[]): Promise<ClinicalEvolution[]> {
  if (!evolutions.length) return evolutions;
  const ids = evolutions.map((e) => e.id);
  const ph  = ids.map(() => "?").join(",");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM evolution_pathologies WHERE evolution_id IN (${ph}) ORDER BY created_at ASC`,
    ids,
  );
  const epMap = new Map<string, EvolutionPathology[]>();
  for (const r of rows) {
    const ep = mapRow<EvolutionPathology>(r);
    const arr = epMap.get(ep.evolutionId) ?? [];
    arr.push(ep);
    epMap.set(ep.evolutionId, arr);
  }
  return evolutions.map((e) => ({ ...e, evolutionPathologies: epMap.get(e.id) ?? [] }));
}

export function createClinicalEvolutionRepository() {
  return {
    async findById(id: string, adminId: string): Promise<ClinicalEvolution | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT ce.* FROM clinical_evolutions ce
         JOIN appointments a ON a.id = ce.appointment_id
         JOIN patient p ON p.id = a.patient_id
         WHERE ce.id = ? AND ce.deleted_at IS NULL AND p.admin_id = ? LIMIT 1`,
        [id, adminId],
      );
      if (!rows[0]) return null;
      const [evo] = await attachPathologies([mapRow<ClinicalEvolution>(rows[0])]);
      return evo ?? null;
    },

    async findByAppointment(appointmentId: string, adminId: string): Promise<ClinicalEvolution[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT ce.* FROM clinical_evolutions ce
         JOIN appointments a ON a.id = ce.appointment_id
         JOIN patient p ON p.id = a.patient_id
         WHERE ce.appointment_id = ? AND ce.deleted_at IS NULL AND p.admin_id = ?
         ORDER BY ce.created_at DESC`,
        [appointmentId, adminId],
      );
      return attachPathologies(rows.map((r) => mapRow<ClinicalEvolution>(r)));
    },

    async existsAppointmentForAdmin(appointmentId: string, adminId: string): Promise<boolean> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 1 FROM appointments a
         JOIN patient p ON p.id = a.patient_id
         WHERE a.id = ? AND a.deleted_at IS NULL AND p.admin_id = ? LIMIT 1`,
        [appointmentId, adminId],
      );
      return (rows as RowDataPacket[]).length > 0;
    },

    async create(data: Omit<ClinicalEvolution, "createdAt" | "updatedAt" | "deletedAt" | "evolutionPathologies">): Promise<ClinicalEvolution> {
      await pool.execute(
        `INSERT INTO clinical_evolutions
           (id, appointment_id, clinical_notes, prescribed_medications,
            home_care_recommendations, recommended_return_days)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.id, data.appointmentId, data.clinicalNotes ?? null,
          data.prescribedMedications ?? null, data.homeCareRecommendations ?? null,
          data.recommendedReturnDays ?? null,
        ],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM clinical_evolutions WHERE id = ? LIMIT 1",
        [data.id],
      );
      return mapRow<ClinicalEvolution>(rows[0]!);
    },

    async update(id: string, data: Record<string, unknown>): Promise<ClinicalEvolution> {
      const { clause, values } = buildSet(data);
      if (clause) {
        await pool.execute(
          `UPDATE clinical_evolutions SET ${clause} WHERE id = ?`,
          [...values, id],
        );
      }
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM clinical_evolutions WHERE id = ? LIMIT 1",
        [id],
      );
      return mapRow<ClinicalEvolution>(rows[0]!);
    },

    async softDelete(id: string): Promise<ClinicalEvolution> {
      await pool.execute(
        "UPDATE clinical_evolutions SET deleted_at = ? WHERE id = ?",
        [nowSP(), id],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM clinical_evolutions WHERE id = ? LIMIT 1",
        [id],
      );
      return mapRow<ClinicalEvolution>(rows[0]!);
    },
  };
}

export type ClinicalEvolutionRepository = ReturnType<typeof createClinicalEvolutionRepository>;
