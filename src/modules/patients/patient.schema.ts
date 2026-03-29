import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

const isoDateString = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida. Use formato ISO 8601." });

const maritalStatusEnum = z.enum(["single", "married", "divorced", "widowed", "other"]);

export const createPatientSchema = z.object({
  fullName: z.string().min(1),
  cpf: z.string().regex(/^\d{11}$/),
  dateOfBirth: isoDateString.optional().nullable(),
  maritalStatus: maritalStatusEnum.optional().nullable(),
  occupation: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  zipCode: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  addressNumber: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  professionalIds: z.array(z.string().uuid()).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();
