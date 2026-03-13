import type { Request, Response } from "express";
import {
  getBillingById,
  listBillingsByAppointment,
  listAllBillings,
  createBilling,
  updateBilling,
  deleteBilling,
} from "../services/billing.service";
import type { CreateBillingInput, UpdateBillingInput } from "../services/billing.service";

const findBillingById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const billing = await getBillingById(id);

  if (!billing) {
    res.status(404).json({ status: "error", message: "Cobrança não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", data: billing });
};

const listBillingsByAppointmentController = async (req: Request, res: Response): Promise<void> => {
  const appointmentId = req.params["appointmentId"] as string;
  const billings = await listBillingsByAppointment(appointmentId);
  res.status(200).json({ status: "ok", data: billings });
};

const listAllBillingsController = async (_req: Request, res: Response): Promise<void> => {
  const billings = await listAllBillings();
  res.status(200).json({ status: "ok", data: billings });
};

const createBillingController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as CreateBillingInput | undefined;

  if (!body?.appointmentId || !body?.amount || !body?.paymentMethod) {
    res.status(400).json({
      status: "error",
      message: "Agendamento, valor e método de pagamento são obrigatórios",
    });
    return;
  }

  const billing = await createBilling(body);
  res.status(201).json({ status: "ok", data: billing });
};

const updateBillingController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const body = req.body as UpdateBillingInput | undefined;

  if (!body || Object.keys(body).length === 0) {
    res.status(400).json({ status: "error", message: "Nenhum dado para atualizar" });
    return;
  }

  const billing = await updateBilling(id, body);

  if (!billing) {
    res.status(404).json({ status: "error", message: "Cobrança não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", data: billing });
};

const deleteBillingController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const deleted = await deleteBilling(id);

  if (!deleted) {
    res.status(404).json({ status: "error", message: "Cobrança não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Cobrança removida com sucesso" });
};

export {
  findBillingById,
  listBillingsByAppointmentController,
  listAllBillingsController,
  createBillingController,
  updateBillingController,
  deleteBillingController,
};
