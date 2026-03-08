import crypto from "crypto";
import { prisma } from "../lib";
import type {
  Anamnesis,
  Perfusion,
  PainSensitivity,
} from "@prisma/client";

interface CreateAnamnesisInput {
  patientId: string;
  frequentlyUsedFootwear?: string | null;
  frequentlyUsedSocks?: string | null;
  practicedSports?: string | null;
  hasLowerLimbSurgery?: boolean;
  lowerLimbSurgeryDetails?: string | null;
  medicationsInUse?: string | null;
  isPregnant?: boolean;
  hasPacemakerOrPins?: boolean;
  hasHypertension?: boolean;
  hasSeizures?: boolean;
  hasCancerHistory?: boolean;
  hasDiabetes?: boolean;
  hasCirculatoryProblems?: boolean;
  hasHealingProblems?: boolean;
  perfusion?: Perfusion;
  hasMonofilamentSensitivity?: boolean;
  dermatologicalPathologies?: string | null;
  nailPathologies?: string | null;
  otherObservations?: string | null;
  painSensitivity?: PainSensitivity | null;
}

type UpdateAnamnesisInput = Partial<Omit<CreateAnamnesisInput, "patientId">>;

const getAnamnesisById = async (
  id: string,
): Promise<Anamnesis | null> => {
  return prisma.anamnesis.findFirst({
    where: { id, deletedAt: null },
  });
};

const listAnamnesesByPatient = async (
  patientId: string,
): Promise<Anamnesis[]> => {
  return prisma.anamnesis.findMany({
    where: { patientId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
};

const createAnamnesis = async (
  data: CreateAnamnesisInput,
): Promise<Anamnesis> => {
  return prisma.anamnesis.create({
    data: {
      id: crypto.randomUUID(),
      patientId: data.patientId,
      frequentlyUsedFootwear: data.frequentlyUsedFootwear ?? null,
      frequentlyUsedSocks: data.frequentlyUsedSocks ?? null,
      practicedSports: data.practicedSports ?? null,
      hasLowerLimbSurgery: data.hasLowerLimbSurgery ?? false,
      lowerLimbSurgeryDetails: data.lowerLimbSurgeryDetails ?? null,
      medicationsInUse: data.medicationsInUse ?? null,
      isPregnant: data.isPregnant ?? false,
      hasPacemakerOrPins: data.hasPacemakerOrPins ?? false,
      hasHypertension: data.hasHypertension ?? false,
      hasSeizures: data.hasSeizures ?? false,
      hasCancerHistory: data.hasCancerHistory ?? false,
      hasDiabetes: data.hasDiabetes ?? false,
      hasCirculatoryProblems: data.hasCirculatoryProblems ?? false,
      hasHealingProblems: data.hasHealingProblems ?? false,
      perfusion: data.perfusion ?? "normal",
      hasMonofilamentSensitivity: data.hasMonofilamentSensitivity ?? true,
      dermatologicalPathologies: data.dermatologicalPathologies ?? null,
      nailPathologies: data.nailPathologies ?? null,
      otherObservations: data.otherObservations ?? null,
      painSensitivity: data.painSensitivity ?? "none",
    },
  });
};

const updateAnamnesis = async (
  id: string,
  data: UpdateAnamnesisInput,
): Promise<Anamnesis | null> => {
  const existing = await prisma.anamnesis.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) return null;

  return prisma.anamnesis.update({
    where: { id },
    data,
  });
};

const deleteAnamnesis = async (id: string): Promise<boolean> => {
  const existing = await prisma.anamnesis.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) return false;

  await prisma.anamnesis.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
};

export {
  getAnamnesisById,
  listAnamnesesByPatient,
  createAnamnesis,
  updateAnamnesis,
  deleteAnamnesis,
};
export type { CreateAnamnesisInput, UpdateAnamnesisInput };
