import crypto from "crypto";
import type { Professional } from "@prisma/client";
import type { ProfessionalRepository } from "./professional.repository";
import { NotFoundError } from "../../shared/errors";

export interface CreateProfessionalInput {
  fullName: string;
  specialty?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
}

export type UpdateProfessionalInput = Partial<CreateProfessionalInput> & {
  isActive?: boolean;
};

export function createProfessionalService(repo: ProfessionalRepository) {
  return {
    async getById(id: string): Promise<Professional> {
      const professional = await repo.findById(id);
      if (!professional) throw new NotFoundError("Profissional não encontrado");
      return professional;
    },

    list(search?: string): Promise<Professional[]> {
      return repo.findMany(search);
    },

    listActive(): Promise<Professional[]> {
      return repo.findActive();
    },

    create(data: CreateProfessionalInput): Promise<Professional> {
      return repo.create({
        id: crypto.randomUUID(),
        fullName: data.fullName,
        specialty: data.specialty ?? null,
        phoneNumber: data.phoneNumber ?? null,
        email: data.email ?? null,
      });
    },

    async update(id: string, data: UpdateProfessionalInput): Promise<Professional> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Profissional não encontrado");
      return repo.update(id, data as Record<string, unknown>);
    },

    async delete(id: string): Promise<void> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Profissional não encontrado");
      await repo.softDelete(id);
    },
  };
}

export type ProfessionalService = ReturnType<typeof createProfessionalService>;
