import crypto from "crypto";
import { prisma } from "../lib";
import type { Appointment, AppointmentStatus } from "@prisma/client";

interface CreateAppointmentInput {
  patientId: string;
  userId: string;
  professionalId?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  scheduledDate: string;
  status?: AppointmentStatus;
  notes?: string | null;
}

interface UpdateAppointmentInput {
  professionalId?: string | null;
  scheduledStart?: string;
  scheduledEnd?: string;
  scheduledDate?: string;
  status?: AppointmentStatus;
  notes?: string | null;
}

class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentConflictError";
  }
}

class AppointmentStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentStatusError";
  }
}

/**
 * Checks for time conflicts with existing appointments.
 * Two appointments conflict when their time ranges overlap.
 */
const checkTimeConflict = async (
  start: Date,
  end: Date,
  excludeId?: string,
): Promise<void> => {
  const conflicting = await prisma.appointment.findFirst({
    where: {
      deletedAt: null,
      status: { notIn: ["cancelled"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      scheduledStart: { lt: end },
      scheduledEnd: { gt: start },
    },
    include: { patient: true },
  });

  if (conflicting) {
    const conflictStart = conflicting.scheduledStart.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const conflictEnd = conflicting.scheduledEnd.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const patientName = conflicting.patient?.fullName ?? "Paciente";
    throw new AppointmentConflictError(
      `Conflito de horário: já existe uma consulta de ${patientName} das ${conflictStart} às ${conflictEnd}`,
    );
  }
};

const getAppointmentById = async (
  id: string,
): Promise<Appointment | null> => {
  return prisma.appointment.findFirst({
    where: { id, deletedAt: null },
    include: { patient: true, user: true, professional: true },
  });
};

const listAppointments = async (): Promise<Appointment[]> => {
  return prisma.appointment.findMany({
    where: { deletedAt: null },
    include: {
      patient: {
        include: {
          _count: { select: { anamneses: true } },
          anamneses: { where: { deletedAt: null }, take: 1, orderBy: { createdAt: "desc" } },
        },
      },
      user: true,
      professional: true,
    },
    orderBy: { scheduledDate: "desc" },
  });
};

const listAppointmentsByPatient = async (
  patientId: string,
): Promise<Appointment[]> => {
  return prisma.appointment.findMany({
    where: { patientId, deletedAt: null },
    include: { patient: true, user: true, professional: true, clinicalEvolutions: { where: { deletedAt: null }, include: { evolutionPathologies: { include: { pathology: true } } } } },
    orderBy: { scheduledDate: "desc" },
  });
};

const createAppointment = async (
  data: CreateAppointmentInput,
): Promise<Appointment> => {
  const start = new Date(data.scheduledStart);
  const end = new Date(data.scheduledEnd);

  await checkTimeConflict(start, end);

  return prisma.appointment.create({
    data: {
      id: crypto.randomUUID(),
      patientId: data.patientId,
      userId: data.userId,
      professionalId: data.professionalId ?? null,
      scheduledStart: start,
      scheduledEnd: end,
      scheduledDate: new Date(data.scheduledDate),
      status: data.status ?? "scheduled",
      notes: data.notes ?? null,
    },
  });
};

const updateAppointment = async (
  id: string,
  data: UpdateAppointmentInput,
): Promise<Appointment | null> => {
  const existing = await prisma.appointment.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) return null;

  // Only consultations with status "scheduled" are fully editable
  if (data.scheduledStart || data.scheduledEnd || data.scheduledDate || data.notes !== undefined) {
    if (existing.status !== "scheduled" && !data.status) {
      throw new AppointmentStatusError(
        "Apenas consultas com status 'Agendada' podem ser editadas",
      );
    }
  }

  // Check time conflicts when changing schedule
  if (data.scheduledStart || data.scheduledEnd) {
    const newStart = data.scheduledStart ? new Date(data.scheduledStart) : existing.scheduledStart;
    const newEnd = data.scheduledEnd ? new Date(data.scheduledEnd) : existing.scheduledEnd;
    await checkTimeConflict(newStart, newEnd, id);
  }

  // Handle status transitions with actual time recording
  const updateData: Record<string, unknown> = {};

  if (data.scheduledStart) updateData.scheduledStart = new Date(data.scheduledStart);
  if (data.scheduledEnd) updateData.scheduledEnd = new Date(data.scheduledEnd);
  if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.professionalId !== undefined) updateData.professionalId = data.professionalId;

  if (data.status) {
    // Validate status transitions
    if (data.status === "in_progress") {
      if (existing.status !== "scheduled" && existing.status !== "confirmed") {
        throw new AppointmentStatusError(
          "Apenas consultas 'Agendada' ou 'Confirmada' podem ser iniciadas",
        );
      }
      const now = new Date();
      updateData.status = "in_progress";
      updateData.actualStartTime = now;
      updateData.scheduledStart = now;
      updateData.scheduledDate = now;
    } else if (data.status === "completed") {
      if (existing.status !== "in_progress") {
        throw new AppointmentStatusError(
          "Apenas consultas 'Em Atendimento' podem ser finalizadas",
        );
      }
      const now = new Date();
      updateData.status = "completed";
      updateData.actualEndTime = now;
      updateData.scheduledEnd = now;
    } else {
      updateData.status = data.status;
    }
  }

  return prisma.appointment.update({
    where: { id },
    data: updateData,
    include: { patient: true, user: true, professional: true },
  });
};

const deleteAppointment = async (id: string): Promise<boolean> => {
  const existing = await prisma.appointment.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) return false;

  await prisma.appointment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
};

export {
  getAppointmentById,
  listAppointments,
  listAppointmentsByPatient,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  AppointmentConflictError,
  AppointmentStatusError,
};
export type { CreateAppointmentInput, UpdateAppointmentInput };
