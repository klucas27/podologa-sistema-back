import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const createPatientSchema = z.object({
  fullName: z.string().min(1),
  cpf: z.string().regex(/^\d{11}$/),
  dateOfBirth: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().nullable().optional(),
  zipCode: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  addressNumber: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
});

export const updatePatientSchema = createPatientSchema.partial();
