import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const createProfessionalSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  specialty: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const updateProfessionalSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório").optional(),
  specialty: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional(),
});
