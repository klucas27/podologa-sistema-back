import type { PrismaClient, Pathology } from "@prisma/client";

export function createPathologyRepository(prisma: PrismaClient) {
  return {
    findById(id: string): Promise<Pathology | null> {
      return prisma.pathology.findUnique({ where: { id } });
    },

    findMany(): Promise<Pathology[]> {
      return prisma.pathology.findMany({ orderBy: { name: "asc" } });
    },

    create(data: { id: string; name: string; description: string | null }): Promise<Pathology> {
      return prisma.pathology.create({ data });
    },

    update(id: string, data: Record<string, unknown>): Promise<Pathology> {
      return prisma.pathology.update({ where: { id }, data });
    },

    delete(id: string): Promise<Pathology> {
      return prisma.pathology.delete({ where: { id } });
    },
  };
}

export type PathologyRepository = ReturnType<typeof createPathologyRepository>;
