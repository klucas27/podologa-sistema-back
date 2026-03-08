import { prisma } from "../lib";
import type { EvolutionPathology, BodyPart } from "@prisma/client";

interface CreateEvolutionPathologyInput {
  evolutionId: string;
  pathologyId: string;
  bodyPart: BodyPart;
  notes?: string | null;
}

interface UpdateEvolutionPathologyInput {
  notes?: string | null;
}

interface EvolutionPathologyKey {
  evolutionId: string;
  pathologyId: string;
  bodyPart: BodyPart;
}

const getEvolutionPathology = async (
  key: EvolutionPathologyKey,
): Promise<EvolutionPathology | null> => {
  return prisma.evolutionPathology.findUnique({
    where: {
      evolutionId_pathologyId_bodyPart: key,
    },
    include: { pathology: true },
  });
};

const listByEvolution = async (
  evolutionId: string,
): Promise<EvolutionPathology[]> => {
  return prisma.evolutionPathology.findMany({
    where: { evolutionId },
    include: { pathology: true },
    orderBy: { createdAt: "asc" },
  });
};

const createEvolutionPathology = async (
  data: CreateEvolutionPathologyInput,
): Promise<EvolutionPathology> => {
  return prisma.evolutionPathology.create({
    data: {
      evolutionId: data.evolutionId,
      pathologyId: data.pathologyId,
      bodyPart: data.bodyPart,
      notes: data.notes ?? null,
    },
  });
};

const updateEvolutionPathology = async (
  key: EvolutionPathologyKey,
  data: UpdateEvolutionPathologyInput,
): Promise<EvolutionPathology | null> => {
  const existing = await prisma.evolutionPathology.findUnique({
    where: { evolutionId_pathologyId_bodyPart: key },
  });

  if (!existing) return null;

  return prisma.evolutionPathology.update({
    where: { evolutionId_pathologyId_bodyPart: key },
    data: {
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });
};

const deleteEvolutionPathology = async (
  key: EvolutionPathologyKey,
): Promise<boolean> => {
  const existing = await prisma.evolutionPathology.findUnique({
    where: { evolutionId_pathologyId_bodyPart: key },
  });

  if (!existing) return false;

  await prisma.evolutionPathology.delete({
    where: { evolutionId_pathologyId_bodyPart: key },
  });

  return true;
};

export {
  getEvolutionPathology,
  listByEvolution,
  createEvolutionPathology,
  updateEvolutionPathology,
  deleteEvolutionPathology,
};
export type {
  CreateEvolutionPathologyInput,
  UpdateEvolutionPathologyInput,
  EvolutionPathologyKey,
};
