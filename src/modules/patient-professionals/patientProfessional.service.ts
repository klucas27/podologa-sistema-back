import type { PatientProfessionalRepository } from "./patientProfessional.repository";
import { AppError, ForbiddenError } from "../../shared/errors";

interface Deps {
  patientProfessionalRepo: PatientProfessionalRepository;
}

interface AdminContext {
  adminId: string;
}

export function createPatientProfessionalService({ patientProfessionalRepo }: Deps) {
  async function assertPatientOwnership(patientId: string, adminId: string): Promise<void> {
    const ok = await patientProfessionalRepo.existsPatientForAdmin(patientId, adminId);
    if (!ok) throw new ForbiddenError("Acesso negado ao paciente");
  }

  async function assertProfessionalOwnership(professionalId: string, adminId: string): Promise<void> {
    const ok = await patientProfessionalRepo.existsProfessionalForAdmin(professionalId, adminId);
    if (!ok) throw new ForbiddenError("Acesso negado ao profissional");
  }

  return {
    async listByPatient(patientId: string, ctx: AdminContext) {
      await assertPatientOwnership(patientId, ctx.adminId);
      return patientProfessionalRepo.findByPatient(patientId);
    },

    async link(patientId: string, professionalId: string, ctx: AdminContext) {
      await assertPatientOwnership(patientId, ctx.adminId);
      await assertProfessionalOwnership(professionalId, ctx.adminId);
      return patientProfessionalRepo.link(patientId, professionalId);
    },

    async unlink(patientId: string, professionalId: string, ctx: AdminContext) {
      await assertPatientOwnership(patientId, ctx.adminId);
      try {
        return await patientProfessionalRepo.unlink(patientId, professionalId);
      } catch {
        throw new AppError("Vínculo não encontrado", 404);
      }
    },

    async replaceAll(patientId: string, professionalIds: string[], ctx: AdminContext) {
      await assertPatientOwnership(patientId, ctx.adminId);
      for (const profId of professionalIds) {
        await assertProfessionalOwnership(profId, ctx.adminId);
      }
      return patientProfessionalRepo.replaceAll(patientId, professionalIds);
    },
  };
}

export type PatientProfessionalService = ReturnType<typeof createPatientProfessionalService>;
