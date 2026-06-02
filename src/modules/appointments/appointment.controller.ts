import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import { paginationSchema } from "../../shared/utils/pagination";
import type { createAppointmentService } from "./appointment.service";

type AppointmentService = ReturnType<typeof createAppointmentService>;

function normalizeScheduledDate<T>(appt: T): T {
  if (!appt || typeof appt !== "object") return appt;
  const record = appt as Record<string, unknown>;
  if (record["scheduledDate"] instanceof Date) {
    // mysql2 (timezone '+00:00') devolve DATE como meia-noite UTC.
    // slice(0,10) extrai "YYYY-MM-DD" de forma segura.
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
        const appointment = await service.getById(id, req.user!);
        res.status(200).json({ status: "ok", data: sanitizeOutput(normalizeAppointments(appointment)) });
      } catch (err) { next(err); }
    },

    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const pg = paginationSchema.parse(req.query);
        const result = await service.list(req.user!, pg);
        res.status(200).json({ status: "ok", ...sanitizeOutput({ data: normalizeAppointments(result.data), pagination: result.pagination }) });
      } catch (err) { next(err); }
    },

    async listByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const patientId = req.params["patientId"] as string;
        const appointments = await service.listByPatient(patientId, req.user!);
        res.status(200).json({ status: "ok", data: sanitizeOutput(normalizeAppointments(appointments)) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const appointment = await service.create({
          ...req.body,
          userId: req.user!.userId,
        }, req.user!);
        res.status(201).json({ status: "ok", data: sanitizeOutput(normalizeAppointments(appointment)) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const appointment = await service.update(id, req.body, req.user!);
        res.status(200).json({ status: "ok", data: sanitizeOutput(normalizeAppointments(appointment)) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id, req.user!);
        res.status(200).json({ status: "ok", message: "Agendamento removido com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type AppointmentController = ReturnType<typeof createAppointmentController>;
