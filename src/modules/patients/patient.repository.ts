import type { RowDataPacket } from "mysql2";
import { pool, withTransaction } from "../../infra/database";
import { mapRow } from "../../infra/database/helpers";
import type { Patient, Anamnesis } from "../../types/models";

// ── Helpers locais ──────────────────────────────────────────────────────────

function rowToPatient(r: RowDataPacket): Patient {
  return mapRow<Patient>(r);
}

function rowToAnamnesis(r: RowDataPacket): Anamnesis {
  return mapRow<Anamnesis>(r);
}

async function attachAnamneses(
  patients: Patient[],
): Promise<(Patient & { _count: { anamneses: number }; anamneses: Anamnesis[] })[]> {
  if (patients.length === 0) return [];

  const ids = patients.map((p) => p.id);
  const ph  = ids.map(() => "?").join(",");

  // Contagem total por paciente
  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT patient_id, COUNT(*) AS cnt FROM anamnesis WHERE patient_id IN (${ph}) GROUP BY patient_id`,
    ids,
  );
  const countMap = new Map<string, number>();
  for (const r of countRows) countMap.set(r["patient_id"] as string, r["cnt"] as number);

  // Anamnese mais recente por paciente (não deletada)
  const [anamRows] = await pool.execute<RowDataPacket[]>(
    `SELECT a.*
     FROM anamnesis a
     INNER JOIN (
       SELECT patient_id, MAX(created_at) AS max_c
       FROM anamnesis
       WHERE deleted_at IS NULL AND patient_id IN (${ph})
       GROUP BY patient_id
     ) m ON m.patient_id = a.patient_id AND a.created_at = m.max_c
     WHERE a.deleted_at IS NULL`,
    ids,
  );
  const anamMap = new Map<string, Anamnesis[]>();
  for (const r of anamRows) {
    const a   = rowToAnamnesis(r);
    const arr = anamMap.get(a.patientId) ?? [];
    arr.push(a);
    anamMap.set(a.patientId, arr);
  }

  return patients.map((p) => ({
    ...p,
    _count:   { anamneses: countMap.get(p.id) ?? 0 },
    anamneses: anamMap.get(p.id) ?? [],
  }));
}

// ── Factory ─────────────────────────────────────────────────────────────────

export function createPatientRepository() {
  return {
    async findById(id: string, adminId: string): Promise<Patient | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM patient WHERE id = ? AND admin_id = ? LIMIT 1",
        [id, adminId],
      );
      return rows[0] ? rowToPatient(rows[0]) : null;
    },

    async findByIdForProfessional(id: string, professionalId: string): Promise<Patient | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT p.* FROM patient p
         JOIN patient_professional pp ON pp.patient_id = p.id
         WHERE p.id = ? AND pp.professional_id = ? LIMIT 1`,
        [id, professionalId],
      );
      return rows[0] ? rowToPatient(rows[0]) : null;
    },

    async findMany(adminId: string, search?: string) {
      const params: (string | number)[] = [adminId];
      let extra = "";
      if (search) {
        extra = " AND (p.full_name LIKE ? OR p.phone_number LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM patient p WHERE p.admin_id = ?${extra} ORDER BY p.full_name ASC`,
        params,
      );
      return attachAnamneses(rows.map(rowToPatient));
    },

    async findManyForProfessional(professionalId: string, search?: string) {
      const params: (string | number)[] = [professionalId];
      let extra = "";
      if (search) {
        extra = " AND (p.full_name LIKE ? OR p.phone_number LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT p.* FROM patient p
         JOIN patient_professional pp ON pp.patient_id = p.id
         WHERE pp.professional_id = ?${extra}
         ORDER BY p.full_name ASC`,
        params,
      );
      return attachAnamneses(rows.map(rowToPatient));
    },

    async create(data: Omit<Patient, "_count" | "anamneses" | "createdAt" | "updatedAt">): Promise<Patient> {
      await pool.execute(
        `INSERT INTO patient
           (id, admin_id, full_name, date_of_birth, marital_status, occupation,
            cpf, phone_number, email, zip_code, street, address_number,
            neighborhood, city, state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id, data.adminId, data.fullName, data.dateOfBirth ?? null,
          data.maritalStatus, data.occupation ?? null, data.cpf,
          data.phoneNumber ?? null, data.email ?? null, data.zipCode ?? null,
          data.street ?? null, data.addressNumber ?? null,
          data.neighborhood ?? null, data.city ?? null, data.state ?? null,
        ],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM patient WHERE id = ? LIMIT 1",
        [data.id],
      );
      return rowToPatient(rows[0]!);
    },

    async update(id: string, data: Partial<Patient>): Promise<Patient> {
      const fields: string[] = [];
      const vals: (string | number | Date | null)[] = [];
      const map: Record<string, string> = {
        fullName:      "full_name",
        dateOfBirth:   "date_of_birth",
        maritalStatus: "marital_status",
        occupation:    "occupation",
        cpf:           "cpf",
        phoneNumber:   "phone_number",
        email:         "email",
        zipCode:       "zip_code",
        street:        "street",
        addressNumber: "address_number",
        neighborhood:  "neighborhood",
        city:          "city",
        state:         "state",
      };
      for (const [k, col] of Object.entries(map)) {
        if ((data as Record<string, unknown>)[k] !== undefined) {
          fields.push(`\`${col}\` = ?`);
          vals.push((data as Record<string, unknown>)[k] as string | number | Date | null);
        }
      }
      if (fields.length > 0) {
        await pool.execute(
          `UPDATE patient SET ${fields.join(", ")} WHERE id = ?`,
          [...vals, id],
        );
      }
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM patient WHERE id = ? LIMIT 1",
        [id],
      );
      return rowToPatient(rows[0]!);
    },

    async delete(id: string): Promise<Patient> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM patient WHERE id = ? LIMIT 1",
        [id],
      );
      await pool.execute("DELETE FROM patient WHERE id = ?", [id]);
      return rowToPatient(rows[0]!);
    },

    async forceDeleteCascade(id: string): Promise<void> {
      await withTransaction(async (conn) => {
        const [apts] = await conn.execute<RowDataPacket[]>(
          "SELECT id FROM appointments WHERE patient_id = ?",
          [id],
        );
        const aptIds = (apts as RowDataPacket[]).map((r) => r["id"] as string);

        if (aptIds.length > 0) {
          const aptPh = aptIds.map(() => "?").join(",");
          const [evos] = await conn.execute<RowDataPacket[]>(
            `SELECT id FROM clinical_evolutions WHERE appointment_id IN (${aptPh})`,
            aptIds,
          );
          const evoIds = (evos as RowDataPacket[]).map((r) => r["id"] as string);

          if (evoIds.length > 0) {
            const evoPh = evoIds.map(() => "?").join(",");
            await conn.execute(
              `DELETE FROM evolution_pathologies WHERE evolution_id IN (${evoPh})`,
              evoIds,
            );
          }
          await conn.execute(
            `DELETE FROM clinical_evolutions WHERE appointment_id IN (${aptPh})`,
            aptIds,
          );
          await conn.execute(
            `DELETE FROM billings WHERE appointment_id IN (${aptPh})`,
            aptIds,
          );
          await conn.execute(
            `DELETE FROM appointments WHERE patient_id = ?`,
            [id],
          );
        }

        await conn.execute("DELETE FROM patient_professional WHERE patient_id = ?", [id]);
        await conn.execute("DELETE FROM anamnesis WHERE patient_id = ?", [id]);
        await conn.execute("DELETE FROM patient WHERE id = ?", [id]);
      });
    },
  };
}

export type PatientRepository = ReturnType<typeof createPatientRepository>;
