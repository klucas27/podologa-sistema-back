import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createAppointmentService } from "./appointment.service";

type AppointmentService = ReturnType<typeof createAppointmentService>;

export function createAppointmentController(service: AppointmentService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const appointment = await service.getById(id);
        res.status(200).json({ status: "ok", data: sanitizeOutput(appointment) });
      } catch (err) { next(err); }
    },

    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const filters: { adminId?: string; professionalId?: string } = {};
        if (req.user!.role === "professional" && req.user!.professionalId) {
          filters.professionalId = req.user!.professionalId;
        } else {
          filters.adminId = req.user!.adminId;
        }
        const appointments = await service.list(filters);
        res.status(200).json({ status: "ok", data: sanitizeOutput(appointments) });
      } catch (err) { next(err); }
    },

    async listByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const patientId = req.params["patientId"] as string;
        const appointments = await service.listByPatient(patientId);
        res.status(200).json({ status: "ok", data: sanitizeOutput(appointments) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const appointment = await service.create({
          ...req.body,
          userId: req.user!.userId,
        });
        res.status(201).json({ status: "ok", data: sanitizeOutput(appointment) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const appointment = await service.update(id, req.body);
        res.status(200).json({ status: "ok", data: sanitizeOutput(appointment) });
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
