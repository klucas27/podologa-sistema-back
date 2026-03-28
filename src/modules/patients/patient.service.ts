import crypto from "crypto";
import type { Patient, MaritalStatus } from "@prisma/client";
import type { PatientRepository } from "./patient.repository";
import { NotFoundError } from "../../shared/errors";

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

export function createPatientService(repo: PatientRepository) {
  return {
    async getById(id: string): Promise<Patient> {
      const patient = await repo.findById(id);
      if (!patient) throw new NotFoundError("Paciente não encontrado");
      return patient;
    },

    list(search?: string) {
      return repo.findMany(search);
    },

    create(data: CreatePatientInput) {
      return repo.create({
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
      });
    },

    async update(id: string, data: UpdatePatientInput) {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Paciente não encontrado");

      return repo.update(id, {
        ...data,
        dateOfBirth: data.dateOfBirth !== undefined
          ? (data.dateOfBirth ? new Date(data.dateOfBirth) : null)
          : undefined,
      });
    },

    async delete(id: string): Promise<void> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Paciente não encontrado");
      await repo.delete(id);
    },

    async forceDelete(id: string): Promise<void> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Paciente não encontrado");
      await repo.forceDeleteCascade(id);
    },
  };
}

export type PatientService = ReturnType<typeof createPatientService>;
