import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { Professional } from "../../types/models";
import type { ProfessionalRepository } from "./professional.repository";
import { NotFoundError, ConflictError } from "../../shared/errors";

export interface CreateProfessionalInput {
  fullName: string;
  specialty?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  username: string;
  password: string;
}

export type UpdateProfessionalInput = Partial<CreateProfessionalInput> & {
  isActive?: boolean;
};

interface UserContext {
  adminId: string;
}

export function createProfessionalService(repo: ProfessionalRepository) {
  return {
    async getById(id: string, ctx: UserContext): Promise<Professional> {
      const professional = await repo.findById(id, ctx.adminId);
      if (!professional) throw new NotFoundError("Profissional não encontrado");
      return professional;
    },

    list(ctx: UserContext, search?: string): Promise<Professional[]> {
      return repo.findMany(ctx.adminId, search);
    },

    listActive(ctx: UserContext): Promise<Professional[]> {
      return repo.findActive(ctx.adminId);
    },

    async create(data: CreateProfessionalInput, ctx: UserContext): Promise<Professional> {
      const existingUser = await repo.findUserByUsername(data.username);
      if (existingUser) throw new ConflictError("Username já está em uso");

      const passwordHash = await bcrypt.hash(data.password, 10);
      const professionalId = crypto.randomUUID();

      return repo.createWithUser(
        {
          id: professionalId,
          adminId: ctx.adminId,
          fullName: data.fullName,
          specialty: data.specialty ?? null,
          phoneNumber: data.phoneNumber ?? null,
          email: data.email ?? null,
        },
        {
          id: crypto.randomUUID(),
          username: data.username,
          passwordHash,
          professionalName: data.fullName,
        },
      );
    },

    async update(id: string, data: UpdateProfessionalInput, ctx: UserContext): Promise<Professional> {
      const existing = await repo.findById(id, ctx.adminId);
      if (!existing) throw new NotFoundError("Profissional não encontrado");

      const updateData: Record<string, unknown> = {};
      if (data.fullName !== undefined) updateData["fullName"] = data.fullName;
      if (data.specialty !== undefined) updateData["specialty"] = data.specialty;
      if (data.phoneNumber !== undefined) updateData["phoneNumber"] = data.phoneNumber;
      if (data.email !== undefined) updateData["email"] = data.email;
      if (data.isActive !== undefined) updateData["isActive"] = data.isActive;

      return repo.update(id, updateData);
    },

    async delete(id: string, ctx: UserContext): Promise<void> {
      const existing = await repo.findById(id, ctx.adminId);
      if (!existing) throw new NotFoundError("Profissional não encontrado");
      await repo.softDelete(id);
    },
  };
}

export type ProfessionalService = ReturnType<typeof createProfessionalService>;
