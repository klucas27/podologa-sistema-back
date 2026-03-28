import crypto from "crypto";
import type { Pathology } from "@prisma/client";
import type { PathologyRepository } from "./pathology.repository";
import { NotFoundError } from "../../shared/errors";

export interface CreatePathologyInput {
  name: string;
  description?: string | null;
}

export interface UpdatePathologyInput {
  name?: string;
  description?: string | null;
}

export function createPathologyService(repo: PathologyRepository) {
  return {
    async getById(id: string): Promise<Pathology> {
      const pathology = await repo.findById(id);
      if (!pathology) throw new NotFoundError("Patologia não encontrada");
      return pathology;
    },

    list(): Promise<Pathology[]> {
      return repo.findMany();
    },

    create(data: CreatePathologyInput): Promise<Pathology> {
      return repo.create({
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description ?? null,
      });
    },

    async update(id: string, data: UpdatePathologyInput): Promise<Pathology> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Patologia não encontrada");

      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData["name"] = data.name;
      if (data.description !== undefined) updateData["description"] = data.description;

      return repo.update(id, updateData);
    },

    async delete(id: string): Promise<void> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Patologia não encontrada");
      await repo.delete(id);
    },
  };
}

export type PathologyService = ReturnType<typeof createPathologyService>;
