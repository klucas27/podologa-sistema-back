import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const appointmentIdParamSchema = z.object({
  appointmentId: z.string().uuid(),
});

const paymentMethodEnum = z.enum(["pix", "credit_card", "debit_card", "cash", "transfer", "other"]);
const billingStatusEnum = z.enum(["pending", "paid", "cancelled", "refunded"]);

export const createBillingSchema = z.object({
  appointmentId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: paymentMethodEnum,
  status: billingStatusEnum.optional(),
  paidAt: z.string().optional().nullable(),
});

export const updateBillingSchema = z.object({
  amount: z.number().positive().optional(),
  paymentMethod: paymentMethodEnum.optional(),
  status: billingStatusEnum.optional(),
  paidAt: z.string().optional().nullable(),
});
