import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const createProfessionalSchema = z.object({
  fullName: z.string().min(1).max(200),
  specialty: z.string().max(150).optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(8).max(72),
});

export const updateProfessionalSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  specialty: z.string().max(150).optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  password: z.string().min(8).max(72).optional(),
  isActive: z.boolean().optional(),
});
