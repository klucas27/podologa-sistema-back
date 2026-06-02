import type { RowDataPacket } from "mysql2";
import { pool, withTransaction } from "../../infra/database";
import type { PatientProfessional } from "../../types/models";

export function createPatientProfessionalRepository() {
  return {
    async existsPatientForAdmin(patientId: string, adminId: string): Promise<boolean> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM patient WHERE id = ? AND admin_id = ? LIMIT 1",
        [patientId, adminId],
      );
      return (rows as RowDataPacket[]).length > 0;
    },

    async existsProfessionalForAdmin(professionalId: string, adminId: string): Promise<boolean> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM professional WHERE id = ? AND admin_id = ? LIMIT 1",
        [professionalId, adminId],
      );
      return (rows as RowDataPacket[]).length > 0;
    },

    async findByPatient(patientId: string): Promise<PatientProfessional[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT pp.patient_id, pp.professional_id, pp.created_at,
                p.id AS prof_id, p.full_name AS prof_fullName, p.specialty AS prof_specialty
         FROM patient_professional pp
         JOIN professional p ON p.id = pp.professional_id
         WHERE pp.patient_id = ?`,
        [patientId],
      );
      return rows.map((r) => ({
        patientId:      r["patient_id"] as string,
        professionalId: r["professional_id"] as string,
        createdAt:      r["created_at"] as Date,
        professional: {
          id:        r["prof_id"] as string,
          fullName:  r["prof_fullName"] as string,
          specialty: r["prof_specialty"] as string | null,
        },
      }));
    },

    async link(patientId: string, professionalId: string): Promise<PatientProfessional> {
      // INSERT IGNORE para evitar conflito de chave duplicada
      await pool.execute(
        `INSERT IGNORE INTO patient_professional (patient_id, professional_id) VALUES (?, ?)`,
        [patientId, professionalId],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM patient_professional WHERE patient_id = ? AND professional_id = ? LIMIT 1",
        [patientId, professionalId],
      );
      const r = rows[0]!;
      return {
        patientId:      r["patient_id"] as string,
        professionalId: r["professional_id"] as string,
        createdAt:      r["created_at"] as Date,
      };
    },

    async unlink(patientId: string, professionalId: string): Promise<void> {
      await pool.execute(
        "DELETE FROM patient_professional WHERE patient_id = ? AND professional_id = ?",
        [patientId, professionalId],
      );
    },

    async replaceAll(patientId: string, professionalIds: string[]): Promise<PatientProfessional[]> {
      return withTransaction(async (conn) => {
        await conn.execute(
          "DELETE FROM patient_professional WHERE patient_id = ?",
          [patientId],
        );
        if (professionalIds.length > 0) {
          const placeholders = professionalIds.map(() => "(?, ?)").join(", ");
          const values = professionalIds.flatMap((profId) => [patientId, profId]);
          await conn.execute(
            `INSERT INTO patient_professional (patient_id, professional_id) VALUES ${placeholders}`,
            values,
          );
        }
        const [rows] = await conn.execute<RowDataPacket[]>(
          `SELECT pp.patient_id, pp.professional_id, pp.created_at,
                  p.id AS prof_id, p.full_name AS prof_fullName, p.specialty AS prof_specialty
           FROM patient_professional pp
           JOIN professional p ON p.id = pp.professional_id
           WHERE pp.patient_id = ?`,
          [patientId],
        );
        return (rows as RowDataPacket[]).map((r) => ({
          patientId:      r["patient_id"] as string,
          professionalId: r["professional_id"] as string,
          createdAt:      r["created_at"] as Date,
          professional: {
            id:        r["prof_id"] as string,
            fullName:  r["prof_fullName"] as string,
            specialty: r["prof_specialty"] as string | null,
          },
        }));
      });
    },
  };
}

export type PatientProfessionalRepository = ReturnType<typeof createPatientProfessionalRepository>;
