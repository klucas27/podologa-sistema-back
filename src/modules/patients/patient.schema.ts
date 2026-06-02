import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

const maritalStatusEnum = z.enum(["single", "married", "divorced", "widowed", "other"]);

export const createPatientSchema = z.object({
  fullName: z.string().min(1).max(200),
  cpf: z.string().regex(/^\d{11}$/),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => !isNaN(Date.parse(d)), { message: "Data inválida" }).optional().nullable(),
  maritalStatus: maritalStatusEnum.optional().nullable(),
  occupation: z.string().max(150).optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  zipCode: z.string().max(10).optional().nullable(),
  street: z.string().max(255).optional().nullable(),
  addressNumber: z.string().max(20).optional().nullable(),
  neighborhood: z.string().max(150).optional().nullable(),
  city: z.string().max(150).optional().nullable(),
  state: z.string().regex(/^[A-Za-z]{2}$/).optional().nullable(),
});

export const updatePatientSchema = createPatientSchema.partial();
