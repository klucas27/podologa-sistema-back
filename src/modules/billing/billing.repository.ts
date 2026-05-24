import type { RowDataPacket, FieldPacket } from "mysql2";
import { pool } from "../../infra/database";
import { mapRow, buildSet } from "../../infra/database/helpers";
import type { Billing, Appointment, Patient, Professional } from "../../types/models";
import { nowSP } from "../../shared/utils/date";

async function rowToBillingWithAppointment(r: RowDataPacket): Promise<Billing> {
  const billing = mapRow<Billing>(r);
  const [aptRows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM appointments WHERE id = ? LIMIT 1",
    [billing.appointmentId],
  );
  if (aptRows[0]) {
    const apt = mapRow<Appointment>(aptRows[0]);
    const [[patRows], [profRows]] = await Promise.all([
      pool.execute<RowDataPacket[]>("SELECT * FROM patient WHERE id = ? LIMIT 1", [apt.patientId]),
      apt.professionalId
        ? pool.execute<RowDataPacket[]>("SELECT * FROM professional WHERE id = ? LIMIT 1", [apt.professionalId])
        : Promise.resolve([[]] as unknown as [RowDataPacket[], FieldPacket[]]),
    ]);
    billing.appointment = {
      ...apt,
      patient:      (patRows as RowDataPacket[])[0] ? mapRow<Patient>((patRows as RowDataPacket[])[0]!) : undefined,
      professional: (profRows as RowDataPacket[])[0] ? mapRow<Professional>((profRows as RowDataPacket[])[0]!) : null,
    };
  }
  return billing;
}

export function createBillingRepository() {
  return {
    async findById(id: string): Promise<Billing | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM billings WHERE id = ? AND deleted_at IS NULL LIMIT 1",
        [id],
      );
      if (!rows[0]) return null;
      return rowToBillingWithAppointment(rows[0]);
    },

    async findByAppointment(appointmentId: string): Promise<Billing[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM billings WHERE appointment_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
        [appointmentId],
      );
      return rows.map((r) => mapRow<Billing>(r));
    },

    async findAll(adminId: string): Promise<Billing[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT b.*,
                a.id AS apt_id, a.patient_id AS apt_patientId, a.professional_id AS apt_professionalId,
                a.scheduled_start AS apt_scheduledStart, a.scheduled_end AS apt_scheduledEnd,
                a.scheduled_date AS apt_scheduledDate, a.status AS apt_status, a.notes AS apt_notes,
                a.created_at AS apt_createdAt, a.updated_at AS apt_updatedAt,
                p.id AS pat_id, p.full_name AS pat_fullName, p.cpf AS pat_cpf,
                p.phone_number AS pat_phoneNumber, p.email AS pat_email,
                p.admin_id AS pat_adminId, p.marital_status AS pat_maritalStatus,
                p.created_at AS pat_createdAt, p.updated_at AS pat_updatedAt,
                prof.id AS prof_id, prof.full_name AS prof_fullName, prof.specialty AS prof_specialty,
                prof.email AS prof_email, prof.is_active AS prof_isActive,
                prof.admin_id AS prof_adminId, prof.created_at AS prof_createdAt,
                prof.updated_at AS prof_updatedAt
         FROM billings b
         JOIN appointments a ON a.id = b.appointment_id
         JOIN patient p ON p.id = a.patient_id
         LEFT JOIN professional prof ON prof.id = a.professional_id
         WHERE b.deleted_at IS NULL AND a.deleted_at IS NULL AND p.admin_id = ?
         ORDER BY b.created_at DESC`,
        [adminId],
      );
      return rows.map((r) => assembleBillingRow(r));
    },

    async findAllForProfessional(professionalId: string): Promise<Billing[]> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT b.*,
                a.id AS apt_id, a.patient_id AS apt_patientId, a.professional_id AS apt_professionalId,
                a.scheduled_start AS apt_scheduledStart, a.scheduled_end AS apt_scheduledEnd,
                a.scheduled_date AS apt_scheduledDate, a.status AS apt_status, a.notes AS apt_notes,
                a.created_at AS apt_createdAt, a.updated_at AS apt_updatedAt,
                p.id AS pat_id, p.full_name AS pat_fullName, p.cpf AS pat_cpf,
                p.phone_number AS pat_phoneNumber, p.email AS pat_email,
                p.admin_id AS pat_adminId, p.marital_status AS pat_maritalStatus,
                p.created_at AS pat_createdAt, p.updated_at AS pat_updatedAt,
                prof.id AS prof_id, prof.full_name AS prof_fullName, prof.specialty AS prof_specialty,
                prof.email AS prof_email, prof.is_active AS prof_isActive,
                prof.admin_id AS prof_adminId, prof.created_at AS prof_createdAt,
                prof.updated_at AS prof_updatedAt
         FROM billings b
         JOIN appointments a ON a.id = b.appointment_id
         JOIN patient p ON p.id = a.patient_id
         LEFT JOIN professional prof ON prof.id = a.professional_id
         WHERE b.deleted_at IS NULL AND a.deleted_at IS NULL AND a.professional_id = ?
         ORDER BY b.created_at DESC`,
        [professionalId],
      );
      return rows.map((r) => assembleBillingRow(r));
    },

    async create(data: Omit<Billing, "createdAt" | "updatedAt" | "appointment">): Promise<Billing> {
      await pool.execute(
        `INSERT INTO billings (id, appointment_id, amount, payment_method, status, paid_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id, data.appointmentId, data.amount,
          data.paymentMethod, data.status, data.paidAt ?? null, data.deletedAt ?? null,
        ],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM billings WHERE id = ? LIMIT 1",
        [data.id],
      );
      return mapRow<Billing>(rows[0]!);
    },

    async update(id: string, data: Record<string, unknown>): Promise<Billing> {
      const { clause, values } = buildSet(data);
      if (clause) {
        await pool.execute(
          `UPDATE billings SET ${clause} WHERE id = ?`,
          [...values, id],
        );
      }
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM billings WHERE id = ? LIMIT 1",
        [id],
      );
      return mapRow<Billing>(rows[0]!);
    },

    async softDelete(id: string): Promise<Billing> {
      await pool.execute(
        "UPDATE billings SET deleted_at = ? WHERE id = ?",
        [nowSP(), id],
      );
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM billings WHERE id = ? LIMIT 1",
        [id],
      );
      return mapRow<Billing>(rows[0]!);
    },
  };
}

// ── Monta objeto Billing com appointment+patient+professional a partir de JOIN ──

function assembleBillingRow(r: RowDataPacket): Billing {
  const billing: Billing = {
    id:            r["id"] as string,
    appointmentId: r["appointment_id"] as string,
    amount:        r["amount"] as number,
    paymentMethod: r["payment_method"] as Billing["paymentMethod"],
    status:        r["status"] as Billing["status"],
    paidAt:        r["paid_at"] as Date | null,
    createdAt:     r["created_at"] as Date,
    updatedAt:     r["updated_at"] as Date,
    deletedAt:     r["deleted_at"] as Date | null,
  };

  const apt: Appointment = {
    id:             r["apt_id"] as string,
    patientId:      r["apt_patientId"] as string,
    userId:         r["user_id"] as string,
    professionalId: r["apt_professionalId"] as string | null,
    scheduledStart: r["apt_scheduledStart"] as Date,
    scheduledEnd:   r["apt_scheduledEnd"] as Date,
    scheduledDate:  r["apt_scheduledDate"] as Date,
    actualStartTime: null,
    actualEndTime:  null,
    status:         r["apt_status"] as Appointment["status"],
    notes:          r["apt_notes"] as string | null,
    createdAt:      r["apt_createdAt"] as Date,
    updatedAt:      r["apt_updatedAt"] as Date,
    deletedAt:      null,
  };

  apt.patient = r["pat_id"]
    ? {
        id:            r["pat_id"] as string,
        adminId:       r["pat_adminId"] as string,
        fullName:      r["pat_fullName"] as string,
        cpf:           r["pat_cpf"] as string,
        phoneNumber:   r["pat_phoneNumber"] as string | null,
        email:         r["pat_email"] as string | null,
        maritalStatus: r["pat_maritalStatus"] as Patient["maritalStatus"],
        createdAt:     r["pat_createdAt"] as Date,
        updatedAt:     r["pat_updatedAt"] as Date,
        dateOfBirth: null, occupation: null, zipCode: null, street: null,
        addressNumber: null, neighborhood: null, city: null, state: null,
      }
    : undefined;

  apt.professional = r["prof_id"]
    ? {
        id:          r["prof_id"] as string,
        adminId:     r["prof_adminId"] as string,
        fullName:    r["prof_fullName"] as string,
        specialty:   r["prof_specialty"] as string | null,
        email:       r["prof_email"] as string | null,
        isActive:    r["prof_isActive"] as boolean,
        phoneNumber: null, deletedAt: null,
        createdAt:   r["prof_createdAt"] as Date,
        updatedAt:   r["prof_updatedAt"] as Date,
      }
    : null;

  billing.appointment = apt;
  return billing;
}

export type BillingRepository = ReturnType<typeof createBillingRepository>;
