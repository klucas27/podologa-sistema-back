import type { PrismaClient, EvolutionPathology, BodyPart } from "@prisma/client";

export interface EvolutionPathologyKey {
  evolutionId: string;
  pathologyId: string;
  bodyPart: BodyPart;
}

export function createEvolutionPathologyRepository(prisma: PrismaClient) {
  return {
    findByKey(key: EvolutionPathologyKey): Promise<EvolutionPathology | null> {
      return prisma.evolutionPathology.findUnique({
        where: { evolutionId_pathologyId_bodyPart: key },
        include: { pathology: true },
      });
    },

    findByEvolution(evolutionId: string): Promise<EvolutionPathology[]> {
      return prisma.evolutionPathology.findMany({
        where: { evolutionId },
        include: { pathology: true },
        orderBy: { createdAt: "asc" },
      });
    },

    create(data: {
      evolutionId: string;
      pathologyId: string;
      bodyPart: BodyPart;
      notes: string | null;
    }): Promise<EvolutionPathology> {
      return prisma.evolutionPathology.create({ data });
    },

    update(key: EvolutionPathologyKey, data: Record<string, unknown>): Promise<EvolutionPathology> {
      return prisma.evolutionPathology.update({
        where: { evolutionId_pathologyId_bodyPart: key },
        data,
      });
    },

    delete(key: EvolutionPathologyKey): Promise<EvolutionPathology> {
      return prisma.evolutionPathology.delete({
        where: { evolutionId_pathologyId_bodyPart: key },
      });
    },
  };
}

export type EvolutionPathologyRepository = ReturnType<typeof createEvolutionPathologyRepository>;
