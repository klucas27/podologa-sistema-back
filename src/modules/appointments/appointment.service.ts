import crypto from "crypto";
import type { Appointment, AppointmentStatus } from "@prisma/client";
import type { AppointmentRepository } from "./appointment.repository";
import { NotFoundError, ConflictError, AppError } from "../../shared/errors";

export interface CreateAppointmentInput {
  patientId: string;
  userId: string;
  professionalId?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  scheduledDate: string;
  status?: AppointmentStatus;
  notes?: string | null;
}

export interface UpdateAppointmentInput {
  professionalId?: string | null;
  scheduledStart?: string;
  scheduledEnd?: string;
  scheduledDate?: string;
  status?: AppointmentStatus;
  notes?: string | null;
}

export function createAppointmentService(repo: AppointmentRepository) {
  async function checkTimeConflict(start: Date, end: Date, excludeId?: string): Promise<void> {
    const conflicting = await repo.findConflicting(start, end, excludeId);
    if (conflicting) {
      const conflictStart = conflicting.scheduledStart.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const conflictEnd = conflicting.scheduledEnd.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

    list(): Promise<Appointment[]> {
      return repo.findMany();
    },

    listByPatient(patientId: string): Promise<Appointment[]> {
      return repo.findByPatient(patientId);
    },

    async create(data: CreateAppointmentInput): Promise<Appointment> {
      const start = new Date(data.scheduledStart);
      const end = new Date(data.scheduledEnd);
      await checkTimeConflict(start, end);

      return repo.create({
        id: crypto.randomUUID(),
        patientId: data.patientId,
        userId: data.userId,
        professionalId: data.professionalId ?? null,
        scheduledStart: start,
        scheduledEnd: end,
        scheduledDate: new Date(data.scheduledDate),
        status: data.status ?? "scheduled",
        notes: data.notes ?? null,
      });
    },

    async update(id: string, data: UpdateAppointmentInput): Promise<Appointment> {
      const existing = await repo.findByIdRaw(id);
      if (!existing) throw new NotFoundError("Agendamento não encontrado");

      if (data.scheduledStart || data.scheduledEnd || data.scheduledDate || data.notes !== undefined) {
        if (existing.status !== "scheduled" && !data.status) {
          throw new AppError("Apenas consultas com status 'Agendada' podem ser editadas", 400);
        }
      }

      if (data.scheduledStart || data.scheduledEnd) {
        const newStart = data.scheduledStart ? new Date(data.scheduledStart) : existing.scheduledStart;
        const newEnd = data.scheduledEnd ? new Date(data.scheduledEnd) : existing.scheduledEnd;
        await checkTimeConflict(newStart, newEnd, id);
      }

      const updateData: Record<string, unknown> = {};
      if (data.scheduledStart) updateData["scheduledStart"] = new Date(data.scheduledStart);
      if (data.scheduledEnd) updateData["scheduledEnd"] = new Date(data.scheduledEnd);
      if (data.scheduledDate) updateData["scheduledDate"] = new Date(data.scheduledDate);
      if (data.notes !== undefined) updateData["notes"] = data.notes;
      if (data.professionalId !== undefined) updateData["professionalId"] = data.professionalId;

      if (data.status) {
        if (data.status === "in_progress") {
          if (existing.status !== "scheduled" && existing.status !== "confirmed") {
            throw new AppError("Apenas consultas 'Agendada' ou 'Confirmada' podem ser iniciadas", 400);
          }
          const now = new Date();
          updateData["status"] = "in_progress";
          updateData["actualStartTime"] = now;
          updateData["scheduledStart"] = now;
          updateData["scheduledDate"] = now;
        } else if (data.status === "completed") {
          if (existing.status !== "in_progress") {
            throw new AppError("Apenas consultas 'Em Atendimento' podem ser finalizadas", 400);
          }
          const now = new Date();
          updateData["status"] = "completed";
          updateData["actualEndTime"] = now;
          updateData["scheduledEnd"] = now;
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
