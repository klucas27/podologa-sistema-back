import crypto from "crypto";
import { prisma } from "../lib";
import type { Appointment, AppointmentStatus } from "@prisma/client";

interface CreateAppointmentInput {
  patientId: string;
  userId: string;
  scheduledStart: string;
  scheduledEnd: string;
  scheduledDate: string;
  status?: AppointmentStatus;
  notes?: string | null;
}

interface UpdateAppointmentInput {
  scheduledStart?: string;
  scheduledEnd?: string;
  scheduledDate?: string;
  status?: AppointmentStatus;
  notes?: string | null;
}

const getAppointmentById = async (
  id: string,
): Promise<Appointment | null> => {
  return prisma.appointment.findFirst({
    where: { id, deletedAt: null },
    include: { patient: true, user: true },
  });
};

const listAppointments = async (): Promise<Appointment[]> => {
  return prisma.appointment.findMany({
    where: { deletedAt: null },
    include: { patient: true, user: true },
    orderBy: { scheduledDate: "desc" },
  });
};

const listAppointmentsByPatient = async (
  patientId: string,
): Promise<Appointment[]> => {
  return prisma.appointment.findMany({
    where: { patientId, deletedAt: null },
    include: { patient: true, user: true, clinicalEvolutions: { where: { deletedAt: null }, include: { evolutionPathologies: { include: { pathology: true } } } } },
    orderBy: { scheduledDate: "desc" },
  });
};

const createAppointment = async (
  data: CreateAppointmentInput,
): Promise<Appointment> => {
  return prisma.appointment.create({
    data: {
      id: crypto.randomUUID(),
      patientId: data.patientId,
      userId: data.userId,
      scheduledStart: new Date(data.scheduledStart),
      scheduledEnd: new Date(data.scheduledEnd),
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

  return prisma.appointment.update({
    where: { id },
    data: {
      ...(data.scheduledStart && {
        scheduledStart: new Date(data.scheduledStart),
      }),
      ...(data.scheduledEnd && { scheduledEnd: new Date(data.scheduledEnd) }),
      ...(data.scheduledDate && {
        scheduledDate: new Date(data.scheduledDate),
      }),
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
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
};
export type { CreateAppointmentInput, UpdateAppointmentInput };
