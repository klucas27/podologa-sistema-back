import crypto from "crypto";
import type { Patient, MaritalStatus } from "@prisma/client";
import type { PatientRepository } from "./patient.repository";
import { NotFoundError, ForbiddenError } from "../../shared/errors";

export interface CreatePatientInput {
  fullName: string;
  dateOfBirth?: string | null;
  maritalStatus?: MaritalStatus;
  occupation?: string | null;
  cpf: string;
  phoneNumber?: string | null;
  email?: string | null;
  zipCode?: string | null;
  street?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  professionalIds?: string[];
}

export type UpdatePatientInput = Partial<CreatePatientInput>;

interface TenantContext {
  userId: string;
  adminId: string;
  role: "admin" | "professional";
  professionalId?: string | null;
}

export function createPatientService(repo: PatientRepository) {
  async function assertAccess(id: string, ctx: TenantContext): Promise<Patient> {
    const patient = await repo.findById(id, ctx.adminId);
    if (!patient) throw new NotFoundError("Paciente não encontrado");
    return patient;
  }

  return {
    async getById(id: string, ctx: TenantContext): Promise<Patient> {
      return assertAccess(id, ctx);
    },

    list(ctx: TenantContext, search?: string) {
      if (ctx.role === "professional" && ctx.professionalId) {
        return repo.findManyByProfessional(ctx.professionalId);
      }
      return repo.findMany(ctx.adminId, search);
    },

    async create(data: CreatePatientInput, ctx: TenantContext) {
      if (ctx.role !== "admin") throw new ForbiddenError("Apenas administradores podem cadastrar pacientes");

      const patient = await repo.create({
        id: crypto.randomUUID(),
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        maritalStatus: data.maritalStatus ?? "other",
        occupation: data.occupation ?? null,
        cpf: data.cpf,
        phoneNumber: data.phoneNumber ?? null,
        email: data.email ?? null,
        zipCode: data.zipCode ?? null,
        street: data.street ?? null,
        addressNumber: data.addressNumber ?? null,
        neighborhood: data.neighborhood ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        adminId: ctx.adminId,
      });

      if (data.professionalIds && data.professionalIds.length > 0) {
        await repo.setPatientProfessionals(patient.id, data.professionalIds);
      }

      return patient;
    },

    async update(id: string, data: UpdatePatientInput, ctx: TenantContext) {
      await assertAccess(id, ctx);

      const { professionalIds, ...prismaData } = data;

      const updated = await repo.update(id, {
        ...prismaData,
        dateOfBirth: data.dateOfBirth !== undefined
          ? (data.dateOfBirth ? new Date(data.dateOfBirth) : null)
          : undefined,
      });

      if (professionalIds !== undefined) {
        await repo.setPatientProfessionals(id, professionalIds ?? []);
      }

      return updated;
    },

    async delete(id: string, ctx: TenantContext): Promise<void> {
      if (ctx.role !== "admin") throw new ForbiddenError("Apenas administradores podem excluir pacientes");
      await assertAccess(id, ctx);
      await repo.delete(id);
    },

    async forceDelete(id: string, ctx: TenantContext): Promise<void> {
      if (ctx.role !== "admin") throw new ForbiddenError("Apenas administradores podem excluir pacientes");
      await assertAccess(id, ctx);
      await repo.forceDeleteCascade(id);
    },
  };
}

export type PatientService = ReturnType<typeof createPatientService>;
