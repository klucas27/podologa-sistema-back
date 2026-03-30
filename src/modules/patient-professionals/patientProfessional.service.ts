import type { PatientProfessionalRepository } from "./patientProfessional.repository";
import { AppError } from "../../shared/errors";

interface Deps {
  patientProfessionalRepo: PatientProfessionalRepository;
}

export function createPatientProfessionalService({ patientProfessionalRepo }: Deps) {
  return {
    async listByPatient(patientId: string) {
      return patientProfessionalRepo.findByPatient(patientId);
    },

    async link(patientId: string, professionalId: string) {
      return patientProfessionalRepo.link(patientId, professionalId);
    },

    async unlink(patientId: string, professionalId: string) {
      try {
        return await patientProfessionalRepo.unlink(patientId, professionalId);
      } catch {
        throw new AppError("Vínculo não encontrado", 404);
      }
    },

    async replaceAll(patientId: string, professionalIds: string[]) {
      return patientProfessionalRepo.replaceAll(patientId, professionalIds);
    },
  };
}

export type PatientProfessionalService = ReturnType<typeof createPatientProfessionalService>;
