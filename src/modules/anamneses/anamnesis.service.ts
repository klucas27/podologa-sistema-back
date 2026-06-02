import crypto from "crypto";
import type { Anamnesis, Perfusion, PainSensitivity } from "../../types/models";
import type { AnamnesisRepository } from "./anamnesis.repository";
import { NotFoundError, ForbiddenError } from "../../shared/errors";

interface UserContext {
  adminId: string;
}

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
    async getById(id: string, ctx: UserContext): Promise<Anamnesis> {
      const anamnesis = await repo.findById(id, ctx.adminId);
      if (!anamnesis) throw new NotFoundError("Anamnese não encontrada");
      return anamnesis;
    },

    listByPatient(patientId: string, ctx: UserContext): Promise<Anamnesis[]> {
      return repo.findByPatient(patientId, ctx.adminId);
    },

    async create(data: CreateAnamnesisInput, ctx: UserContext): Promise<Anamnesis> {
      const ok = await repo.existsPatientForAdmin(data.patientId, ctx.adminId);
      if (!ok) throw new ForbiddenError("Acesso negado ao paciente");
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

    async update(id: string, data: UpdateAnamnesisInput, ctx: UserContext): Promise<Anamnesis> {
      const existing = await repo.findById(id, ctx.adminId);
      if (!existing) throw new NotFoundError("Anamnese não encontrada");

      const updateData: Record<string, unknown> = {};
      if (data.frequentlyUsedFootwear !== undefined) updateData["frequentlyUsedFootwear"] = data.frequentlyUsedFootwear;
      if (data.frequentlyUsedSocks !== undefined) updateData["frequentlyUsedSocks"] = data.frequentlyUsedSocks;
      if (data.practicedSports !== undefined) updateData["practicedSports"] = data.practicedSports;
      if (data.hasLowerLimbSurgery !== undefined) updateData["hasLowerLimbSurgery"] = data.hasLowerLimbSurgery;
      if (data.lowerLimbSurgeryDetails !== undefined) updateData["lowerLimbSurgeryDetails"] = data.lowerLimbSurgeryDetails;
      if (data.medicationsInUse !== undefined) updateData["medicationsInUse"] = data.medicationsInUse;
      if (data.isPregnant !== undefined) updateData["isPregnant"] = data.isPregnant;
      if (data.hasPacemakerOrPins !== undefined) updateData["hasPacemakerOrPins"] = data.hasPacemakerOrPins;
      if (data.hasHypertension !== undefined) updateData["hasHypertension"] = data.hasHypertension;
      if (data.hasSeizures !== undefined) updateData["hasSeizures"] = data.hasSeizures;
      if (data.hasCancerHistory !== undefined) updateData["hasCancerHistory"] = data.hasCancerHistory;
      if (data.hasDiabetes !== undefined) updateData["hasDiabetes"] = data.hasDiabetes;
      if (data.hasCirculatoryProblems !== undefined) updateData["hasCirculatoryProblems"] = data.hasCirculatoryProblems;
      if (data.hasHealingProblems !== undefined) updateData["hasHealingProblems"] = data.hasHealingProblems;
      if (data.perfusion !== undefined) updateData["perfusion"] = data.perfusion;
      if (data.hasMonofilamentSensitivity !== undefined) updateData["hasMonofilamentSensitivity"] = data.hasMonofilamentSensitivity;
      if (data.dermatologicalPathologies !== undefined) updateData["dermatologicalPathologies"] = data.dermatologicalPathologies;
      if (data.nailPathologies !== undefined) updateData["nailPathologies"] = data.nailPathologies;
      if (data.otherObservations !== undefined) updateData["otherObservations"] = data.otherObservations;
      if (data.painSensitivity !== undefined) updateData["painSensitivity"] = data.painSensitivity;

      return repo.update(id, updateData);
    },

    async delete(id: string, ctx: UserContext): Promise<void> {
      const existing = await repo.findById(id, ctx.adminId);
      if (!existing) throw new NotFoundError("Anamnese não encontrada");
      await repo.softDelete(id, ctx.adminId);
    },
  };
}

export type AnamnesisService = ReturnType<typeof createAnamnesisService>;
