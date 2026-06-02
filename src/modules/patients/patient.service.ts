import crypto from "crypto";
import type { Patient, MaritalStatus } from "../../types/models";
import type { PatientRepository } from "./patient.repository";
import { NotFoundError } from "../../shared/errors";
import type { PaginationInput } from "../../shared/utils/pagination";
import { toDateOnly } from "../../shared/utils/date";

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
}

export type UpdatePatientInput = Partial<CreatePatientInput>;

interface UserContext {
  userId: string;
  role: "admin" | "professional";
  professionalId: string | null;
  adminId: string;
}

export function createPatientService(repo: PatientRepository) {
  async function findPatient(id: string, ctx: UserContext): Promise<Patient> {
    const patient = ctx.role === "professional" && ctx.professionalId
      ? await repo.findByIdForProfessional(id, ctx.professionalId)
      : await repo.findById(id, ctx.adminId);
    if (!patient) throw new NotFoundError("Paciente não encontrado");
    return patient;
  }

  return {
    async getById(id: string, ctx: UserContext): Promise<Patient> {
      return findPatient(id, ctx);
    },

    list(ctx: UserContext, search: string | undefined, pg: PaginationInput) {
      if (ctx.role === "professional" && ctx.professionalId) {
        return repo.findManyForProfessional(ctx.professionalId, search, pg);
      }
      return repo.findMany(ctx.adminId, search, pg);
    },

    create(data: CreatePatientInput, ctx: UserContext) {
      return repo.create({
        id: crypto.randomUUID(),
        adminId: ctx.adminId,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth ? toDateOnly(data.dateOfBirth) : null,
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
      });
    },

    async update(id: string, data: UpdatePatientInput, ctx: UserContext) {
      await findPatient(id, ctx);

      return repo.update(id, {
        ...data,
        dateOfBirth: data.dateOfBirth !== undefined
          ? (data.dateOfBirth ? toDateOnly(data.dateOfBirth) : null)
          : undefined,
      });
    },

    async delete(id: string, ctx: UserContext): Promise<void> {
      await findPatient(id, ctx);
      await repo.delete(id);
    },

    async forceDelete(id: string, ctx: UserContext): Promise<void> {
      await findPatient(id, ctx);
      await repo.forceDeleteCascade(id);
    },
  };
}

export type PatientService = ReturnType<typeof createPatientService>;
