import { z } from "zod";

const metadataSchema = z.object({
  display_phone_number: z.string(),
  phone_number_id: z.string(),
});

const contactSchema = z.object({
  profile: z.object({ name: z.string() }),
  wa_id: z.string(),
});

const textMessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.literal("text"),
  text: z.object({ body: z.string() }),
});

const otherMessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.string(),
});

const messageSchema = z.union([textMessageSchema, otherMessageSchema]);

const changeValueSchema = z.object({
  messaging_product: z.string(),
  metadata: metadataSchema,
  contacts: z.array(contactSchema).optional(),
  messages: z.array(messageSchema).optional(),
});

const changeSchema = z.object({
  value: changeValueSchema,
  field: z.string(),
});

const entrySchema = z.object({
  id: z.string(),
  changes: z.array(changeSchema),
});

export const webhookBodySchema = z.object({
  object: z.string(),
  entry: z.array(entrySchema),
});

export type WebhookBody = z.infer<typeof webhookBodySchema>;
export type WebhookMessage = z.infer<typeof messageSchema>;
export type TextWebhookMessage = z.infer<typeof textMessageSchema>;
