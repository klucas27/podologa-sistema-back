import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createAppointmentService } from "./appointment.service";

type AppointmentService = ReturnType<typeof createAppointmentService>;

/**
 * Converte scheduledDate (Prisma Date → midnight UTC) em string "YYYY-MM-DD"
 * para eliminar ambiguidade de timezone na serialização JSON.
 * Usa toISOString().slice para extrair a data em UTC (que é como Prisma armazena DATE).
 */
function normalizeScheduledDate<T>(appt: T): T {
  if (!appt || typeof appt !== "object") return appt;
  const record = appt as Record<string, unknown>;
  if (record["scheduledDate"] instanceof Date) {
    // toDateOnly garante noon UTC, então slice(0,10) é seguro
    record["scheduledDate"] = (record["scheduledDate"] as Date)
      .toISOString()
      .slice(0, 10);
  }
  return appt;
}

function normalizeAppointments<T>(data: T): T {
  if (Array.isArray(data)) return data.map(normalizeScheduledDate) as unknown as T;
  return normalizeScheduledDate(data);
}

export function createAppointmentController(service: AppointmentService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const appointment = await service.getById(id);
        res.status(200).json({ status: "ok", data: sanitizeOutput(normalizeAppointments(appointment)) });
      } catch (err) { next(err); }
    },

    async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const appointments = await service.list();
        res.status(200).json({ status: "ok", data: sanitizeOutput(normalizeAppointments(appointments)) });
      } catch (err) { next(err); }
    },

    async listByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const patientId = req.params["patientId"] as string;
        const appointments = await service.listByPatient(patientId);
        res.status(200).json({ status: "ok", data: sanitizeOutput(normalizeAppointments(appointments)) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const appointment = await service.create({
          ...req.body,
          userId: req.user!.userId,
        });
        res.status(201).json({ status: "ok", data: sanitizeOutput(normalizeAppointments(appointment)) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const appointment = await service.update(id, req.body);
        res.status(200).json({ status: "ok", data: sanitizeOutput(normalizeAppointments(appointment)) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id);
        res.status(200).json({ status: "ok", message: "Agendamento removido com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type AppointmentController = ReturnType<typeof createAppointmentController>;
