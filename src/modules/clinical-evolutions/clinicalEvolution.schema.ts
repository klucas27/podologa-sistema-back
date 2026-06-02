import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const appointmentIdParamSchema = z.object({
  appointmentId: z.string().uuid(),
});

export const createClinicalEvolutionSchema = z.object({
  appointmentId: z.string().uuid(),
  clinicalNotes: z.string().max(5000).optional().nullable(),
  prescribedMedications: z.string().max(2000).optional().nullable(),
  homeCareRecommendations: z.string().max(2000).optional().nullable(),
  recommendedReturnDays: z.number().int().min(1).max(365).optional().nullable(),
});

export const updateClinicalEvolutionSchema = createClinicalEvolutionSchema
  .omit({ appointmentId: true })
  .partial();
