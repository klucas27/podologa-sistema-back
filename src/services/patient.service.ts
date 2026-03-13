import crypto from "crypto";
import { prisma } from "../lib";
import type { Patient, MaritalStatus } from "@prisma/client";

interface CreatePatientInput {
  fullName: string;
  dateOfBirth?: string | null;
  maritalStatus?: MaritalStatus;
  occupation?: string | null;
  cpf: string;
  phoneNumber?: string | null;
  email?: string | null;
  zipCode?: string | null;
  street?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

type UpdatePatientInput = Partial<CreatePatientInput>;

const getPatientById = async (id: string): Promise<Patient | null> => {
  return prisma.patient.findUnique({ where: { id } });
};

const listPatients = async (search?: string): Promise<Patient[]> => {
  const where = search
    ? {
        OR: [
          { fullName: { contains: search } },
          { phoneNumber: { contains: search } },
        ],
      }
    : undefined;

  return prisma.patient.findMany({
    where,
    orderBy: { fullName: "asc" },
    include: {
      _count: { select: { anamneses: true } },
      anamneses: {
        where: { deletedAt: null },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });
};

const createPatient = async (data: CreatePatientInput): Promise<Patient> => {
  return prisma.patient.create({
    data: {
      id: crypto.randomUUID(),
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      maritalStatus: data.maritalStatus ?? "other",
      occupation: data.occupation ?? null,
      cpf: data.cpf,
      phoneNumber: data.phoneNumber ?? null,
      email: data.email ?? null,
      zipCode: data.zipCode ?? null,
      street: data.street ?? null,
      addressNumber: data.addressNumber ?? null,
      neighborhood: data.neighborhood ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
    },
  });
};

const updatePatient = async (
  id: string,
  data: UpdatePatientInput,
): Promise<Patient | null> => {
  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) return null;

  const updateData: Record<string, unknown> = { ...data };
  if (data.dateOfBirth !== undefined) {
    updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  }

  return prisma.patient.update({ where: { id }, data: updateData });
};

const deletePatient = async (id: string): Promise<boolean> => {
  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) return false;

  await prisma.patient.delete({ where: { id } });
  return true;
};

const forceDeletePatient = async (id: string): Promise<boolean> => {
  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) return false;

  await prisma.$transaction(async (tx) => {
    const appointments = await tx.appointment.findMany({
      where: { patientId: id },
      select: { id: true },
    });
    const appointmentIds = appointments.map((a) => a.id);

    if (appointmentIds.length > 0) {
      const evolutions = await tx.clinicalEvolution.findMany({
        where: { appointmentId: { in: appointmentIds } },
        select: { id: true },
      });
      const evolutionIds = evolutions.map((e) => e.id);

      if (evolutionIds.length > 0) {
        await tx.evolutionPathology.deleteMany({
          where: { evolutionId: { in: evolutionIds } },
        });
      }

      await tx.clinicalEvolution.deleteMany({
        where: { appointmentId: { in: appointmentIds } },
      });

      await tx.billing.deleteMany({
        where: { appointmentId: { in: appointmentIds } },
      });

      await tx.appointment.deleteMany({
        where: { patientId: id },
      });
    }

    await tx.anamnesis.deleteMany({
      where: { patientId: id },
    });

    await tx.patient.delete({ where: { id } });
  });

  return true;
};

export { getPatientById, listPatients, createPatient, updatePatient, deletePatient, forceDeletePatient };
export type { CreatePatientInput, UpdatePatientInput };
