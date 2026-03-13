import crypto from "crypto";
import { prisma } from "../lib";
import type { Professional } from "@prisma/client";

interface CreateProfessionalInput {
  fullName: string;
  specialty?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
}

type UpdateProfessionalInput = Partial<CreateProfessionalInput> & {
  isActive?: boolean;
};

const getProfessionalById = async (id: string): Promise<Professional | null> => {
  return prisma.professional.findFirst({
    where: { id, deletedAt: null },
  });
};

const listProfessionals = async (search?: string): Promise<Professional[]> => {
  const where: Record<string, unknown> = { deletedAt: null };

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { phoneNumber: { contains: search } },
    ];
  }

  return prisma.professional.findMany({
    where,
    orderBy: { fullName: "asc" },
  });
};

const listActiveProfessionals = async (): Promise<Professional[]> => {
  return prisma.professional.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { fullName: "asc" },
  });
};

const createProfessional = async (data: CreateProfessionalInput): Promise<Professional> => {
  return prisma.professional.create({
    data: {
      id: crypto.randomUUID(),
      fullName: data.fullName,
      specialty: data.specialty ?? null,
      phoneNumber: data.phoneNumber ?? null,
      email: data.email ?? null,
    },
  });
};

const updateProfessional = async (
  id: string,
  data: UpdateProfessionalInput,
): Promise<Professional | null> => {
  const existing = await prisma.professional.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return null;

  return prisma.professional.update({
    where: { id },
    data,
  });
};

const deleteProfessional = async (id: string): Promise<boolean> => {
  const existing = await prisma.professional.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) return false;

  await prisma.professional.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
};

export {
  getProfessionalById,
  listProfessionals,
  listActiveProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
};

export type { CreateProfessionalInput, UpdateProfessionalInput };
