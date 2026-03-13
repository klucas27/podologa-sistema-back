import { Router } from "express";
import {
  findBillingById,
  listBillingsByAppointmentController,
  listAllBillingsController,
  createBillingController,
  updateBillingController,
  deleteBillingController,
} from "../controllers/billing.controller";

const billingRouter = Router();

/**
 * GET /api/billings
 * Lista todas as cobranças.
 */
billingRouter.get("/", listAllBillingsController);

/**
 * GET /api/billings/appointment/:appointmentId
 * Lista cobranças de um agendamento.
 */
billingRouter.get("/appointment/:appointmentId", listBillingsByAppointmentController);

/**
 * GET /api/billings/:id
 * Retorna uma cobrança pelo ID.
 */
billingRouter.get("/:id", findBillingById);

/**
 * POST /api/billings
 * Cadastra uma nova cobrança.
 */
billingRouter.post("/", createBillingController);

/**
 * PATCH /api/billings/:id
 * Atualiza uma cobrança existente.
 */
billingRouter.patch("/:id", updateBillingController);

/**
 * DELETE /api/billings/:id
 * Remove (soft delete) uma cobrança.
 */
billingRouter.delete("/:id", deleteBillingController);

export { billingRouter };
