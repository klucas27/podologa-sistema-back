import type { RowDataPacket } from "mysql2";
import { pool } from "../../infra/database";
import { mapRow, buildSet } from "../../infra/database/helpers";
import type { Anamnesis } from "../../types/models";
import { nowSP } from "../../shared/utils/date";

export function createAnamnesisRepository() {
  return {
    async findById(id: string): Promise<Anamnesis | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM anamnesis WHERE id = ? AND deleted_at IS NULL LIMIT 1",
        [id],
      );
      return rows[0] ? mapRow<Anamnesis>(rows[0]) : null;
    },

    async findByPatient(patientId: string): Promise<Anamnesis[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM anamnesis WHERE patient_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
        [patientId],
      );
      return rows.map((r) => mapRow<Anamnesis>(r));
    },

    async create(data: Omit<Anamnesis, "createdAt" | "updatedAt" | "deletedAt"> & { deletedAt?: Date | null }): Promise<Anamnesis> {
      await pool.execute(
        `INSERT INTO anamnesis
           (id, patient_id,
            frequently_used_footwear, frequently_used_socks, practiced_sports,
            has_lower_limb_surgery, lower_limb_surgery_details, medications_in_use,
            is_pregnant, has_pacemaker_or_pins, has_hypertension, has_seizures,
            has_cancer_history, has_diabetes, has_circulatory_problems, has_healing_problems,
            perfusion, has_monofilament_sensitivity,
            dermatological_pathologies, nail_pathologies, other_observations, pain_sensitivity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id, data.patientId,
          data.frequentlyUsedFootwear ?? null, data.frequentlyUsedSocks ?? null,
          data.practicedSports ?? null,
          data.hasLowerLimbSurgery ? 1 : 0,
          data.lowerLimbSurgeryDetails ?? null, data.medicationsInUse ?? null,
          data.isPregnant ? 1 : 0, data.hasPacemakerOrPins ? 1 : 0,
          data.hasHypertension ? 1 : 0, data.hasSeizures ? 1 : 0,
          data.hasCancerHistory ? 1 : 0, data.hasDiabetes ? 1 : 0,
          data.hasCirculatoryProblems ? 1 : 0, data.hasHealingProblems ? 1 : 0,
          data.perfusion, data.hasMonofilamentSensitivity ? 1 : 0,
          data.dermatologicalPathologies ?? null, data.nailPathologies ?? null,
          data.otherObservations ?? null, data.painSensitivity ?? null,
        ],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM anamnesis WHERE id = ? LIMIT 1",
        [data.id],
      );
      return mapRow<Anamnesis>(rows[0]!);
    },

    async update(id: string, data: Record<string, unknown>): Promise<Anamnesis> {
      const { clause, values } = buildSet(data);
      if (clause) {
        await pool.execute(
          `UPDATE anamnesis SET ${clause} WHERE id = ?`,
          [...values, id],
        );
      }
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM anamnesis WHERE id = ? LIMIT 1",
        [id],
      );
      return mapRow<Anamnesis>(rows[0]!);
    },

    async softDelete(id: string): Promise<Anamnesis> {
      await pool.execute(
        "UPDATE anamnesis SET deleted_at = ? WHERE id = ?",
        [nowSP(), id],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM anamnesis WHERE id = ? LIMIT 1",
        [id],
      );
      return mapRow<Anamnesis>(rows[0]!);
    },
  };
}

export type AnamnesisRepository = ReturnType<typeof createAnamnesisRepository>;
