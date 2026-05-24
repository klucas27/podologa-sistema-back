import crypto from "crypto";
import type { Anamnesis, Perfusion, PainSensitivity } from "../../types/models";
import type { AnamnesisRepository } from "./anamnesis.repository";
import { NotFoundError } from "../../shared/errors";

export interface CreateAnamnesisInput {
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

export type UpdateAnamnesisInput = Partial<Omit<CreateAnamnesisInput, "patientId">>;

export function createAnamnesisService(repo: AnamnesisRepository) {
  return {
    async getById(id: string): Promise<Anamnesis> {
      const anamnesis = await repo.findById(id);
      if (!anamnesis) throw new NotFoundError("Anamnese não encontrada");
      return anamnesis;
    },

    listByPatient(patientId: string): Promise<Anamnesis[]> {
      return repo.findByPatient(patientId);
    },

    create(data: CreateAnamnesisInput): Promise<Anamnesis> {
      return repo.create({
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
      });
    },

    async update(id: string, data: UpdateAnamnesisInput): Promise<Anamnesis> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Anamnese não encontrada");
      return repo.update(id, data as Record<string, unknown>);
    },

    async delete(id: string): Promise<void> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Anamnese não encontrada");
      await repo.softDelete(id);
    },
  };
}

export type AnamnesisService = ReturnType<typeof createAnamnesisService>;
