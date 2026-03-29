import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { Professional } from "@prisma/client";
import type { ProfessionalRepository } from "./professional.repository";
import { NotFoundError, ForbiddenError, ConflictError } from "../../shared/errors";

export interface CreateProfessionalInput {
  fullName: string;
  specialty?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  username: string;
  password: string;
}

export type UpdateProfessionalInput = {
  fullName?: string;
  specialty?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  isActive?: boolean;
};

interface TenantContext {
  userId: string;
  adminId: string;
  role: "admin" | "professional";
}

export function createProfessionalService(repo: ProfessionalRepository) {
  return {
    async getById(id: string, ctx: TenantContext): Promise<Professional> {
      const professional = await repo.findById(id, ctx.adminId);
      if (!professional) throw new NotFoundError("Profissional não encontrado");
      return professional;
    },

    list(ctx: TenantContext, search?: string): Promise<Professional[]> {
      return repo.findMany(ctx.adminId, search);
    },

    listActive(ctx: TenantContext): Promise<Professional[]> {
      return repo.findActive(ctx.adminId);
    },

    async create(data: CreateProfessionalInput, ctx: TenantContext): Promise<Professional> {
      if (ctx.role !== "admin") throw new ForbiddenError("Apenas administradores podem cadastrar profissionais");

      const prisma = repo.getPrisma();

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({ where: { username: data.username } });
      if (existingUser) throw new ConflictError("Usuário já está em uso");

      const userId = crypto.randomUUID();
      const professionalId = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create User + Professional in a transaction
      const [, professional] = await prisma.$transaction([
        prisma.user.create({
          data: {
            id: userId,
            username: data.username,
            passwordHash,
            professionalName: data.fullName,
            role: "professional",
            adminId: ctx.adminId,
          },
        }),
        prisma.professional.create({
          data: {
            id: professionalId,
            fullName: data.fullName,
            specialty: data.specialty ?? null,
            phoneNumber: data.phoneNumber ?? null,
            email: data.email ?? null,
            adminId: ctx.adminId,
            userId,
          },
        }),
      ]);

      return professional;
    },

    async update(id: string, data: UpdateProfessionalInput, ctx: TenantContext): Promise<Professional> {
      if (ctx.role !== "admin") throw new ForbiddenError("Apenas administradores podem editar profissionais");
      const existing = await repo.findById(id, ctx.adminId);
      if (!existing) throw new NotFoundError("Profissional não encontrado");
      return repo.update(id, data as Record<string, unknown>);
    },

    async delete(id: string, ctx: TenantContext): Promise<void> {
      if (ctx.role !== "admin") throw new ForbiddenError("Apenas administradores podem excluir profissionais");
      const existing = await repo.findById(id, ctx.adminId);
      if (!existing) throw new NotFoundError("Profissional não encontrado");
      await repo.softDelete(id);
    },
  };
}

export type ProfessionalService = ReturnType<typeof createProfessionalService>;
