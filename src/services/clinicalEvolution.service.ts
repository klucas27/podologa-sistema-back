import crypto from "crypto";
import { prisma } from "../lib";
import type { ClinicalEvolution } from "@prisma/client";

interface CreateClinicalEvolutionInput {
  appointmentId: string;
  clinicalNotes?: string | null;
  prescribedMedications?: string | null;
  homeCareRecommendations?: string | null;
  recommendedReturnDays?: number | null;
}

interface UpdateClinicalEvolutionInput {
  clinicalNotes?: string | null;
  prescribedMedications?: string | null;
  homeCareRecommendations?: string | null;
  recommendedReturnDays?: number | null;
}

const getClinicalEvolutionById = async (
  id: string,
): Promise<ClinicalEvolution | null> => {
  return prisma.clinicalEvolution.findFirst({
    where: { id, deletedAt: null },
    include: { evolutionPathologies: true },
  });
};

const listClinicalEvolutionsByAppointment = async (
  appointmentId: string,
): Promise<ClinicalEvolution[]> => {
  return prisma.clinicalEvolution.findMany({
    where: { appointmentId, deletedAt: null },
    include: { evolutionPathologies: true },
    orderBy: { createdAt: "desc" },
  });
};

const createClinicalEvolution = async (
  data: CreateClinicalEvolutionInput,
): Promise<ClinicalEvolution> => {
  return prisma.clinicalEvolution.create({
    data: {
      id: crypto.randomUUID(),
      appointmentId: data.appointmentId,
      clinicalNotes: data.clinicalNotes ?? null,
      prescribedMedications: data.prescribedMedications ?? null,
      homeCareRecommendations: data.homeCareRecommendations ?? null,
      recommendedReturnDays: data.recommendedReturnDays ?? null,
    },
  });
};

const updateClinicalEvolution = async (
  id: string,
  data: UpdateClinicalEvolutionInput,
): Promise<ClinicalEvolution | null> => {
  const existing = await prisma.clinicalEvolution.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) return null;

  return prisma.clinicalEvolution.update({
    where: { id },
    data: {
      ...(data.clinicalNotes !== undefined && {
        clinicalNotes: data.clinicalNotes,
      }),
      ...(data.prescribedMedications !== undefined && {
        prescribedMedications: data.prescribedMedications,
      }),
      ...(data.homeCareRecommendations !== undefined && {
        homeCareRecommendations: data.homeCareRecommendations,
      }),
      ...(data.recommendedReturnDays !== undefined && {
        recommendedReturnDays: data.recommendedReturnDays,
      }),
    },
  });
};

const deleteClinicalEvolution = async (id: string): Promise<boolean> => {
  const existing = await prisma.clinicalEvolution.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) return false;

  await prisma.clinicalEvolution.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
};

export {
  getClinicalEvolutionById,
  listClinicalEvolutionsByAppointment,
  createClinicalEvolution,
  updateClinicalEvolution,
  deleteClinicalEvolution,
};
export type { CreateClinicalEvolutionInput, UpdateClinicalEvolutionInput };
