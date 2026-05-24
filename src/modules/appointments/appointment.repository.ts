import type { RowDataPacket, FieldPacket } from "mysql2";
import { pool } from "../../infra/database";
import { mapRow, buildSet } from "../../infra/database/helpers";
import type { Appointment, Patient, Anamnesis, ClinicalEvolution, EvolutionPathology, Pathology, Professional } from "../../types/models";
import { nowSP } from "../../shared/utils/date";

// ── Helpers locais ──────────────────────────────────────────────────────────

function rowToAppointment(r: RowDataPacket): Appointment {
  return mapRow<Appointment>(r);
}

async function fetchWithRelations(id: string): Promise<Appointment | null> {
  const [aptRows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM appointments WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    [id],
  );
  if (!aptRows[0]) return null;
  const apt = rowToAppointment(aptRows[0]);

  const [[patRow], [usrRow], [profRow]] = await Promise.all([
    pool.execute<RowDataPacket[]>("SELECT * FROM patient WHERE id = ? LIMIT 1", [apt.patientId]),
    pool.execute<RowDataPacket[]>(
      "SELECT id, username, professional_name, role, professional_id, workday_start, workday_end, created_at FROM `user` WHERE id = ? LIMIT 1",
      [apt.userId],
    ),
    apt.professionalId
      ? pool.execute<RowDataPacket[]>("SELECT * FROM professional WHERE id = ? LIMIT 1", [apt.professionalId])
      : Promise.resolve([[]] as unknown as [RowDataPacket[], FieldPacket[]]),
  ]);

  const patR = (patRow as RowDataPacket[])[0];
  const usrR = (usrRow as RowDataPacket[])[0];
  const profR = (profRow as RowDataPacket[])[0];

  return {
    ...apt,
    patient: patR ? mapRow<Patient>(patR) : undefined,
    user: usrR
      ? {
          id:               usrR["id"] as string,
          username:         usrR["username"] as string,
          professionalName: usrR["professional_name"] as string | null,
          role:             usrR["role"] as "admin" | "professional",
          professionalId:   usrR["professional_id"] as string | null,
          workdayStart:     usrR["workday_start"] as string,
          workdayEnd:       usrR["workday_end"] as string,
          createdAt:        usrR["created_at"] as Date,
        }
      : undefined,
    professional: profR ? mapRow(profR) : null,
  };
}

async function buildListRows(aptRows: RowDataPacket[]): Promise<Appointment[]> {
  if (!aptRows.length) return [];
  const apts = aptRows.map(rowToAppointment);

  const patIds  = [...new Set(apts.map((a) => a.patientId))];
  const usrIds  = [...new Set(apts.map((a) => a.userId))];
  const profIds = [...new Set(apts.map((a) => a.professionalId).filter(Boolean))] as string[];

  const patPh  = patIds.map(() => "?").join(",");
  const usrPh  = usrIds.map(() => "?").join(",");

  // Pacientes + contagem de anamneses
  const [patRows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.*, COALESCE(ac.cnt, 0) AS anamneses_count
     FROM patient p
     LEFT JOIN (SELECT patient_id, COUNT(*) AS cnt FROM anamnesis GROUP BY patient_id) ac
       ON ac.patient_id = p.id
     WHERE p.id IN (${patPh})`,
    patIds,
  );

  // Última anamnese por paciente
  const [anamRows] = await pool.execute<RowDataPacket[]>(
    `SELECT a.*
     FROM anamnesis a
     INNER JOIN (
       SELECT patient_id, MAX(created_at) AS max_c
       FROM anamnesis WHERE deleted_at IS NULL AND patient_id IN (${patPh})
       GROUP BY patient_id
     ) m ON m.patient_id = a.patient_id AND a.created_at = m.max_c
     WHERE a.deleted_at IS NULL`,
    patIds,
  );

  const anamMap = new Map<string, Anamnesis[]>();
  for (const r of anamRows) {
    const a = mapRow<Anamnesis>(r);
    const arr = anamMap.get(a.patientId) ?? [];
    arr.push(a);
    anamMap.set(a.patientId, arr);
  }

  const patMap = new Map<string, Patient>();
  for (const r of patRows) {
    const p = mapRow<Patient>(r);
    patMap.set(p.id, {
      ...p,
      _count:    { anamneses: (r as RowDataPacket)["anamneses_count"] as number },
      anamneses: anamMap.get(p.id) ?? [],
    });
  }

  const [usrRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, username, professional_name, role, professional_id, workday_start, workday_end, created_at
     FROM \`user\` WHERE id IN (${usrPh})`,
    usrIds,
  );
  const usrMap = new Map<string, Record<string, unknown>>();
  for (const r of usrRows) {
    usrMap.set(r["id"] as string, {
      id: r["id"], username: r["username"],
      professionalName: r["professional_name"], role: r["role"],
      professionalId: r["professional_id"], workdayStart: r["workday_start"],
      workdayEnd: r["workday_end"], createdAt: r["created_at"],
    });
  }

  const profMap = new Map<string, Professional>();
  if (profIds.length > 0) {
    const profPh = profIds.map(() => "?").join(",");
    const [profRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM professional WHERE id IN (${profPh})`,
      profIds,
    );
    for (const r of profRows) profMap.set(r["id"] as string, mapRow<Professional>(r));
  }

  return apts.map((a) => ({
    ...a,
    patient:      patMap.get(a.patientId),
    user:         usrMap.get(a.userId) as Appointment["user"],
    professional: a.professionalId ? (profMap.get(a.professionalId) ?? null) : null,
  }));
}

// ── Factory ─────────────────────────────────────────────────────────────────

export function createAppointmentRepository() {
  return {
    findById(id: string): Promise<Appointment | null> {
      return fetchWithRelations(id);
    },

    async findByIdRaw(id: string): Promise<Appointment | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM appointments WHERE id = ? AND deleted_at IS NULL LIMIT 1",
        [id],
      );
      return rows[0] ? rowToAppointment(rows[0]) : null;
    },

    async findConflicting(start: Date, end: Date, excludeId?: string, professionalId?: string | null): Promise<Appointment | null> {
      const params: (string | Date)[] = ["cancelled", end, start];
      let sql = `SELECT a.*, p.id AS pat_id, p.full_name AS pat_fullName
                 FROM appointments a
                 LEFT JOIN patient p ON p.id = a.patient_id
                 WHERE a.deleted_at IS NULL
                   AND a.status != ?
                   AND a.scheduled_start < ?
                   AND a.scheduled_end > ?`;
      if (excludeId) { sql += " AND a.id != ?"; params.push(excludeId); }
      if (professionalId) { sql += " AND a.professional_id = ?"; params.push(professionalId); }
      sql += " LIMIT 1";

      const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
      if (!rows[0]) return null;

      const r = rows[0];
      const apt = rowToAppointment(r);
      // Só precisamos de patient.fullName para a mensagem de conflito
      if (r["pat_id"]) {
        (apt as Appointment).patient = {
          fullName: r["pat_fullName"] as string,
        } as Patient;
      }
      return apt;
    },

    async findMany(adminId: string): Promise<Appointment[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT a.* FROM appointments a
         JOIN patient p ON p.id = a.patient_id
         WHERE a.deleted_at IS NULL AND p.admin_id = ?
         ORDER BY a.scheduled_date DESC`,
        [adminId],
      );
      return buildListRows(rows);
    },

    async findManyForProfessional(professionalId: string): Promise<Appointment[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM appointments
         WHERE deleted_at IS NULL AND professional_id = ?
         ORDER BY scheduled_date DESC`,
        [professionalId],
      );
      return buildListRows(rows);
    },

    async findByPatient(patientId: string): Promise<Appointment[]> {
      const [aptRows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM appointments
         WHERE patient_id = ? AND deleted_at IS NULL
         ORDER BY scheduled_date DESC`,
        [patientId],
      );
      if (!aptRows.length) return [];
      const apts = aptRows.map(rowToAppointment);
      const aptIds = apts.map((a) => a.id);
      const aptPh  = aptIds.map(() => "?").join(",");

      // Evoluções clínicas com patologias
      const [evoRows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM clinical_evolutions
         WHERE appointment_id IN (${aptPh}) AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        aptIds,
      );
      const evoIds = (evoRows as RowDataPacket[]).map((r) => r["id"] as string);
      let epRows: RowDataPacket[] = [];
      if (evoIds.length > 0) {
        const evoPh = evoIds.map(() => "?").join(",");
        const [epR] = await pool.execute<RowDataPacket[]>(
          `SELECT ep.*, pt.id AS path_id, pt.name AS path_name, pt.description AS path_description,
                  pt.created_at AS path_createdAt, pt.updated_at AS path_updatedAt
           FROM evolution_pathologies ep
           JOIN pathologies pt ON pt.id = ep.pathology_id
           WHERE ep.evolution_id IN (${evoPh})`,
          evoIds,
        );
        epRows = epR;
      }

      const epMap = new Map<string, EvolutionPathology[]>();
      for (const r of epRows) {
        const ep: EvolutionPathology = {
          evolutionId: r["evolution_id"] as string,
          pathologyId: r["pathology_id"] as string,
          bodyPart:    r["body_part"] as EvolutionPathology["bodyPart"],
          notes:       r["notes"] as string | null,
          createdAt:   r["created_at"] as Date,
          updatedAt:   r["updated_at"] as Date,
          pathology: {
            id:          r["path_id"] as string,
            name:        r["path_name"] as string,
            description: r["path_description"] as string | null,
            createdAt:   r["path_createdAt"] as Date,
            updatedAt:   r["path_updatedAt"] as Date,
          } as Pathology,
        };
        const arr = epMap.get(ep.evolutionId) ?? [];
        arr.push(ep);
        epMap.set(ep.evolutionId, arr);
      }

      const evoMap = new Map<string, ClinicalEvolution[]>();
      for (const r of evoRows) {
        const evo = mapRow<ClinicalEvolution>(r);
        evo.evolutionPathologies = epMap.get(evo.id) ?? [];
        const arr = evoMap.get(evo.appointmentId) ?? [];
        arr.push(evo);
        evoMap.set(evo.appointmentId, arr);
      }

      // patient/user/professional para a lista
      const base = await buildListRows(aptRows);
      return base.map((a) => ({ ...a, clinicalEvolutions: evoMap.get(a.id) ?? [] }));
    },

    async create(data: Omit<Appointment, "createdAt" | "updatedAt" | "patient" | "user" | "professional" | "clinicalEvolutions" | "billings">): Promise<Appointment> {
      await pool.execute(
        `INSERT INTO appointments
           (id, patient_id, user_id, professional_id,
            scheduled_start, scheduled_end, scheduled_date,
            actual_start_time, actual_end_time, status, notes, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id, data.patientId, data.userId, data.professionalId ?? null,
          data.scheduledStart, data.scheduledEnd, data.scheduledDate,
          data.actualStartTime ?? null, data.actualEndTime ?? null,
          data.status, data.notes ?? null, data.deletedAt ?? null,
        ],
      );
      return (await fetchWithRelations(data.id))!;
    },

    async update(id: string, data: Record<string, unknown>): Promise<Appointment> {
      const { clause, values } = buildSet(data);
      if (clause) {
        await pool.execute(
          `UPDATE appointments SET ${clause} WHERE id = ?`,
          [...values, id],
        );
      }
      return (await fetchWithRelations(id))!;
    },

    async softDelete(id: string): Promise<Appointment> {
      await pool.execute(
        "UPDATE appointments SET deleted_at = ? WHERE id = ?",
        [nowSP(), id],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM appointments WHERE id = ? LIMIT 1",
        [id],
      );
      return rowToAppointment(rows[0]!);
    },
  };
}

export type AppointmentRepository = ReturnType<typeof createAppointmentRepository>;
