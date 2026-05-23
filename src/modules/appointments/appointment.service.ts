import crypto from "crypto";
import type { Appointment, AppointmentStatus } from "@prisma/client";
import type { AppointmentRepository } from "./appointment.repository";
import { NotFoundError, ConflictError, AppError } from "../../shared/errors";
import { nowSP, toDateOnly, toDate, formatTimeSP } from "../../shared/utils/date";

export interface CreateAppointmentInput {
  patientId: string;
  userId: string;
  professionalId?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  scheduledDate: string;
  status?: AppointmentStatus;
  chiefComplaint?: string | null;
  notes?: string | null;
}

export interface UpdateAppointmentInput {
  professionalId?: string | null;
  scheduledStart?: string;
  scheduledEnd?: string;
  scheduledDate?: string;
  status?: AppointmentStatus;
  chiefComplaint?: string | null;
  notes?: string | null;
}

interface UserContext {
  role: "admin" | "professional";
  professionalId: string | null;
  adminId: string;
}

export function createAppointmentService(repo: AppointmentRepository) {
  async function checkTimeConflict(start: Date, end: Date, excludeId?: string, professionalId?: string | null): Promise<void> {
    const conflicting = await repo.findConflicting(start, end, excludeId, professionalId);
    if (conflicting) {
      const conflictStart = formatTimeSP(conflicting.scheduledStart);
      const conflictEnd = formatTimeSP(conflicting.scheduledEnd);
      const patientName = conflicting.patient?.fullName ?? "Paciente";
      throw new ConflictError(
        `Conflito de horário: já existe uma consulta de ${patientName} das ${conflictStart} às ${conflictEnd}`,
      );
    }
  }

  return {
    async getById(id: string): Promise<Appointment> {
      const appointment = await repo.findById(id);
      if (!appointment) throw new NotFoundError("Agendamento não encontrado");
      return appointment;
    },

    list(ctx: UserContext): Promise<Appointment[]> {
      if (ctx.role === "professional" && ctx.professionalId) {
        return repo.findManyForProfessional(ctx.professionalId);
      }
      return repo.findMany(ctx.adminId);
    },

    listByPatient(patientId: string): Promise<Appointment[]> {
      return repo.findByPatient(patientId);
    },

    async create(data: CreateAppointmentInput, ctx?: UserContext): Promise<Appointment> {
      const start = toDate(data.scheduledStart);
      const end = toDate(data.scheduledEnd);
      const profId = ctx?.role === "professional" && ctx.professionalId
        ? ctx.professionalId
        : data.professionalId ?? null;
      await checkTimeConflict(start, end, undefined, profId);

      return repo.create({
        id: crypto.randomUUID(),
        patientId: data.patientId,
        userId: data.userId,
        professionalId: profId,
        scheduledStart: start,
        scheduledEnd: end,
        scheduledDate: toDateOnly(data.scheduledDate),
        status: data.status ?? "scheduled",
        chiefComplaint: data.chiefComplaint ?? null,
        notes: data.notes ?? null,
      });
    },

    async update(id: string, data: UpdateAppointmentInput): Promise<Appointment> {
      const existing = await repo.findByIdRaw(id);
      if (!existing) throw new NotFoundError("Agendamento não encontrado");

      if (data.scheduledStart || data.scheduledEnd || data.scheduledDate || data.notes !== undefined || data.chiefComplaint !== undefined) {
        if (existing.status !== "scheduled" && !data.status) {
          throw new AppError("Apenas consultas com status 'Agendada' podem ser editadas", 400);
        }
      }

      if (data.scheduledStart || data.scheduledEnd) {
        const newStart = data.scheduledStart ? toDate(data.scheduledStart) : existing.scheduledStart;
        const newEnd = data.scheduledEnd ? toDate(data.scheduledEnd) : existing.scheduledEnd;
        await checkTimeConflict(newStart, newEnd, id);
      }

      const updateData: Record<string, unknown> = {};
      if (data.scheduledStart) updateData["scheduledStart"] = toDate(data.scheduledStart);
      if (data.scheduledEnd) updateData["scheduledEnd"] = toDate(data.scheduledEnd);
      if (data.scheduledDate) updateData["scheduledDate"] = toDateOnly(data.scheduledDate);
      if (data.chiefComplaint !== undefined) updateData["chiefComplaint"] = data.chiefComplaint;
      if (data.notes !== undefined) updateData["notes"] = data.notes;
      if (data.professionalId !== undefined) updateData["professionalId"] = data.professionalId;

      if (data.status) {
        if (data.status === "in_progress") {
          if (existing.status !== "scheduled" && existing.status !== "confirmed") {
            throw new AppError("Apenas consultas 'Agendada' ou 'Confirmada' podem ser iniciadas", 400);
          }
          const now = nowSP();
          updateData["status"] = "in_progress";
          updateData["actualStartTime"] = now;
          updateData["scheduledStart"] = now;
          updateData["scheduledDate"] = toDateOnly(now);
        } else if (data.status === "completed") {
          if (existing.status !== "in_progress") {
            throw new AppError("Apenas consultas 'Em Atendimento' podem ser finalizadas", 400);
          }
          const now = nowSP();
          updateData["status"] = "completed";
          updateData["actualEndTime"] = now;
          updateData["scheduledEnd"] = now;
          updateData["scheduledDate"] = toDateOnly(now);
        } else {
          updateData["status"] = data.status;
        }
      }

      return repo.update(id, updateData);
    },

    async delete(id: string): Promise<void> {
      const existing = await repo.findByIdRaw(id);
      if (!existing) throw new NotFoundError("Agendamento não encontrado");
      await repo.softDelete(id);
    },
  };
}

export type AppointmentService = ReturnType<typeof createAppointmentService>;
