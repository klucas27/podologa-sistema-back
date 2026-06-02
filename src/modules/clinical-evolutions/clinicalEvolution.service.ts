import crypto from "crypto";
import type { ClinicalEvolution } from "../../types/models";
import type { ClinicalEvolutionRepository } from "./clinicalEvolution.repository";
import { NotFoundError, ForbiddenError } from "../../shared/errors";

interface UserContext {
  adminId: string;
}

export interface CreateClinicalEvolutionInput {
  appointmentId: string;
  clinicalNotes?: string | null;
  prescribedMedications?: string | null;
  homeCareRecommendations?: string | null;
  recommendedReturnDays?: number | null;
}

export interface UpdateClinicalEvolutionInput {
  clinicalNotes?: string | null;
  prescribedMedications?: string | null;
  homeCareRecommendations?: string | null;
  recommendedReturnDays?: number | null;
}

export function createClinicalEvolutionService(repo: ClinicalEvolutionRepository) {
  return {
    async getById(id: string, ctx: UserContext): Promise<ClinicalEvolution> {
      const evolution = await repo.findById(id, ctx.adminId);
      if (!evolution) throw new NotFoundError("Evolução clínica não encontrada");
      return evolution;
    },

    listByAppointment(appointmentId: string, ctx: UserContext): Promise<ClinicalEvolution[]> {
      return repo.findByAppointment(appointmentId, ctx.adminId);
    },

    async create(data: CreateClinicalEvolutionInput, ctx: UserContext): Promise<ClinicalEvolution> {
      const ok = await repo.existsAppointmentForAdmin(data.appointmentId, ctx.adminId);
      if (!ok) throw new ForbiddenError("Acesso negado ao agendamento");
      return repo.create({
        id: crypto.randomUUID(),
        appointmentId: data.appointmentId,
        clinicalNotes: data.clinicalNotes ?? null,
        prescribedMedications: data.prescribedMedications ?? null,
        homeCareRecommendations: data.homeCareRecommendations ?? null,
        recommendedReturnDays: data.recommendedReturnDays ?? null,
      });
    },

    async update(id: string, data: UpdateClinicalEvolutionInput, ctx: UserContext): Promise<ClinicalEvolution> {
      const existing = await repo.findById(id, ctx.adminId);
      if (!existing) throw new NotFoundError("Evolução clínica não encontrada");

      const updateData: Record<string, unknown> = {};
      if (data.clinicalNotes !== undefined) updateData["clinicalNotes"] = data.clinicalNotes;
      if (data.prescribedMedications !== undefined) updateData["prescribedMedications"] = data.prescribedMedications;
      if (data.homeCareRecommendations !== undefined) updateData["homeCareRecommendations"] = data.homeCareRecommendations;
      if (data.recommendedReturnDays !== undefined) updateData["recommendedReturnDays"] = data.recommendedReturnDays;

      return repo.update(id, updateData);
    },

    async delete(id: string, ctx: UserContext): Promise<void> {
      const existing = await repo.findById(id, ctx.adminId);
      if (!existing) throw new NotFoundError("Evolução clínica não encontrada");
      await repo.softDelete(id);
    },
  };
}

export type ClinicalEvolutionService = ReturnType<typeof createClinicalEvolutionService>;
