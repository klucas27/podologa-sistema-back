import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

const appointmentStatusEnum = z.enum(["scheduled", "confirmed", "in_progress", "cancelled", "completed"]);

const timeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  professionalId: z.string().uuid().optional().nullable(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledStart: z.string().regex(timeRegex),
  scheduledEnd: z.string().regex(timeRegex),
  status: appointmentStatusEnum.optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateAppointmentSchema = z.object({
  professionalId: z.string().uuid().optional().nullable(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  scheduledStart: z.string().regex(timeRegex).optional(),
  scheduledEnd: z.string().regex(timeRegex).optional(),
  status: appointmentStatusEnum.optional(),
  notes: z.string().max(2000).optional().nullable(),
  actualStartTime: z.string().regex(timeRegex).optional().nullable(),
  actualEndTime: z.string().regex(timeRegex).optional().nullable(),
});
