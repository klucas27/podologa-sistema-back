import type { EvolutionPathology, BodyPart } from "@prisma/client";
import type { EvolutionPathologyRepository, EvolutionPathologyKey } from "./evolutionPathology.repository";
import { NotFoundError } from "../../shared/errors";

export interface CreateEvolutionPathologyInput {
  evolutionId: string;
  pathologyId: string;
  bodyPart: BodyPart;
  notes?: string | null;
}

export interface UpdateEvolutionPathologyInput {
  notes?: string | null;
}

export function createEvolutionPathologyService(repo: EvolutionPathologyRepository) {
  return {
    async getByKey(key: EvolutionPathologyKey): Promise<EvolutionPathology> {
      const record = await repo.findByKey(key);
      if (!record) throw new NotFoundError("Registro não encontrado");
      return record;
    },

    listByEvolution(evolutionId: string): Promise<EvolutionPathology[]> {
      return repo.findByEvolution(evolutionId);
    },

    create(data: CreateEvolutionPathologyInput): Promise<EvolutionPathology> {
      return repo.create({
        evolutionId: data.evolutionId,
        pathologyId: data.pathologyId,
        bodyPart: data.bodyPart,
        notes: data.notes ?? null,
      });
    },

    async update(key: EvolutionPathologyKey, data: UpdateEvolutionPathologyInput): Promise<EvolutionPathology> {
      const existing = await repo.findByKey(key);
      if (!existing) throw new NotFoundError("Registro não encontrado");

      const updateData: Record<string, unknown> = {};
      if (data.notes !== undefined) updateData["notes"] = data.notes;

      return repo.update(key, updateData);
    },

    async delete(key: EvolutionPathologyKey): Promise<void> {
      const existing = await repo.findByKey(key);
      if (!existing) throw new NotFoundError("Registro não encontrado");
      await repo.delete(key);
    },
  };
}

export type EvolutionPathologyService = ReturnType<typeof createEvolutionPathologyService>;
