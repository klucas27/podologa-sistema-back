import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  professionalName: z.string().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const updateWorkingHoursSchema = z.object({
  workdayStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  workdayEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
