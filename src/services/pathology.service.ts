import crypto from "crypto";
import { prisma } from "../lib";
import type { Pathology } from "@prisma/client";

interface CreatePathologyInput {
  name: string;
  description?: string | null;
}

interface UpdatePathologyInput {
  name?: string;
  description?: string | null;
}

const getPathologyById = async (
  id: string,
): Promise<Pathology | null> => {
  return prisma.pathology.findUnique({ where: { id } });
};

const listPathologies = async (): Promise<Pathology[]> => {
  return prisma.pathology.findMany({ orderBy: { name: "asc" } });
};

const createPathology = async (
  data: CreatePathologyInput,
): Promise<Pathology> => {
  return prisma.pathology.create({
    data: {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description ?? null,
    },
  });
};

const updatePathology = async (
  id: string,
  data: UpdatePathologyInput,
): Promise<Pathology | null> => {
  const existing = await prisma.pathology.findUnique({ where: { id } });

  if (!existing) return null;

  return prisma.pathology.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });
};

const deletePathology = async (id: string): Promise<boolean> => {
  const existing = await prisma.pathology.findUnique({ where: { id } });

  if (!existing) return false;

  await prisma.pathology.delete({ where: { id } });

  return true;
};

export {
  getPathologyById,
  listPathologies,
  createPathology,
  updatePathology,
  deletePathology,
};
export type { CreatePathologyInput, UpdatePathologyInput };
