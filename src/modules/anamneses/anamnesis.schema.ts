import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const patientIdParamSchema = z.object({
  patientId: z.string().uuid(),
});

const perfusionEnum = z.enum(["normal", "pale", "cyanotic", "edematous"]);
const painSensitivityEnum = z.enum(["high", "moderate", "low", "none"]);

const textField = z.string().max(1000).optional().nullable();
const boolField = z.boolean().optional();

export const createAnamnesisSchema = z.object({
  patientId: z.string().uuid(),
  frequentlyUsedFootwear: textField,
  frequentlyUsedSocks: textField,
  practicedSports: textField,
  hasLowerLimbSurgery: boolField,
  lowerLimbSurgeryDetails: textField,
  medicationsInUse: textField,
  isPregnant: boolField,
  hasPacemakerOrPins: boolField,
  hasHypertension: boolField,
  hasSeizures: boolField,
  hasCancerHistory: boolField,
  hasDiabetes: boolField,
  hasCirculatoryProblems: boolField,
  hasHealingProblems: boolField,
  perfusion: perfusionEnum.optional(),
  hasMonofilamentSensitivity: boolField,
  dermatologicalPathologies: textField,
  nailPathologies: textField,
  otherObservations: textField,
  painSensitivity: painSensitivityEnum.optional().nullable(),
});

export const updateAnamnesisSchema = createAnamnesisSchema.omit({ patientId: true }).partial();
