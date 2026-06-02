import type { EvolutionPathology, BodyPart } from "../../types/models";
import type { EvolutionPathologyRepository, EvolutionPathologyKey } from "./evolutionPathology.repository";
import { NotFoundError, ForbiddenError } from "../../shared/errors";

interface UserContext {
  adminId: string;
}

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
    async getByKey(key: EvolutionPathologyKey, ctx: UserContext): Promise<EvolutionPathology> {
      const record = await repo.findByKey(key, ctx.adminId);
      if (!record) throw new NotFoundError("Registro não encontrado");
      return record;
    },

    listByEvolution(evolutionId: string, ctx: UserContext): Promise<EvolutionPathology[]> {
      return repo.findByEvolution(evolutionId, ctx.adminId);
    },

    async create(data: CreateEvolutionPathologyInput, ctx: UserContext): Promise<EvolutionPathology> {
      const ok = await repo.existsEvolutionForAdmin(data.evolutionId, ctx.adminId);
      if (!ok) throw new ForbiddenError("Acesso negado à evolução clínica");
      return repo.create({
        evolutionId: data.evolutionId,
        pathologyId: data.pathologyId,
        bodyPart: data.bodyPart,
        notes: data.notes ?? null,
      });
    },

    async update(key: EvolutionPathologyKey, data: UpdateEvolutionPathologyInput, ctx: UserContext): Promise<EvolutionPathology> {
      const existing = await repo.findByKey(key, ctx.adminId);
      if (!existing) throw new NotFoundError("Registro não encontrado");

      const updateData: Record<string, unknown> = {};
      if (data.notes !== undefined) updateData["notes"] = data.notes;

      return repo.update(key, updateData);
    },

    async delete(key: EvolutionPathologyKey, ctx: UserContext): Promise<void> {
      const existing = await repo.findByKey(key, ctx.adminId);
      if (!existing) throw new NotFoundError("Registro não encontrado");
      await repo.delete(key);
    },
  };
}

export type EvolutionPathologyService = ReturnType<typeof createEvolutionPathologyService>;
