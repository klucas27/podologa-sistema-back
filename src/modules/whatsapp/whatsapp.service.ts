import crypto from "crypto";
import { AppError } from "../../shared/errors";
import { logger } from "../../infra/logger";
import { GRAPH_API_URL } from "../../config/whatsapp";
import type { WhatsappRepository } from "./whatsapp.repository";
import type { Env } from "../../config/env";
import type { WebhookBody } from "./whatsapp.schema";

const MENU_MESSAGE = `Olá! 👋 Sou o assistente da Clínica. Como posso ajudar?

1️⃣ Ver minha próxima consulta
2️⃣ Confirmar consulta
3️⃣ Cancelar consulta
4️⃣ Falar com atendente
5️⃣ Horários de funcionamento`;

function formatAppointmentDate(date: Date): string {
  const d = date.getUTCDate().toString().padStart(2, "0");
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const y = date.getUTCFullYear();
  const h = date.getUTCHours().toString().padStart(2, "0");
  const min = date.getUTCMinutes().toString().padStart(2, "0");
  return `${d}/${m}/${y} às ${h}:${min}`;
}

export function createWhatsappService(repo: WhatsappRepository, envConfig: Env) {
  function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (!digits.startsWith("55")) return `55${digits}`;
    return digits;
  }

  async function sendText(phone: string, text: string): Promise<void> {
    const response = await fetch(
      `${GRAPH_API_URL}/${envConfig.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${envConfig.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { preview_url: false, body: text },
        }),
      },
    );

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => ({}));
      logger.error({ status: response.status, body }, "WhatsApp send failed");
      throw new AppError("Falha ao enviar mensagem WhatsApp", 502);
    }
  }

  async function processMessage(from: string, text: string, messageId: string): Promise<void> {
    const phone = normalizePhone(from);
    const trimmed = text.trim();

    const patient = await repo.findPatientByPhone(phone);
    const patientId = patient?.id ?? null;

    await repo.saveMessage({
      id: crypto.randomUUID(),
      patientId,
      phone,
      direction: "inbound",
      content: trimmed,
      externalId: messageId,
    });

    let reply: string;

    if (trimmed === "1") {
      if (!patientId) {
        reply = "Não encontramos uma conta associada a este número. Entre em contato com a clínica.";
      } else {
        const appt = await repo.findNextAppointment(patientId);
        reply = appt
          ? `Sua próxima consulta está marcada para ${formatAppointmentDate(appt.scheduledStart)}.`
          : "Você não possui consultas agendadas no momento.";
      }
    } else if (trimmed === "2") {
      if (!patientId) {
        reply = "Não encontramos uma conta associada a este número.";
      } else {
        const appt = await repo.findNextAppointment(patientId);
        if (!appt) {
          reply = "Você não possui consultas pendentes para confirmar.";
        } else if (appt.status === "confirmed") {
          reply = `Sua consulta de ${formatAppointmentDate(appt.scheduledStart)} já está confirmada. ✅`;
        } else {
          await repo.updateAppointmentStatus(appt.id, "confirmed");
          reply = `Consulta de ${formatAppointmentDate(appt.scheduledStart)} confirmada com sucesso! ✅`;
        }
      }
    } else if (trimmed === "3") {
      if (!patientId) {
        reply = "Não encontramos uma conta associada a este número.";
      } else {
        const appt = await repo.findNextAppointment(patientId);
        if (!appt) {
          reply = "Você não possui consultas para cancelar.";
        } else {
          await repo.updateAppointmentStatus(appt.id, "cancelled");
          reply = `Consulta de ${formatAppointmentDate(appt.scheduledStart)} cancelada. Para reagendar, entre em contato com a clínica.`;
        }
      }
    } else if (trimmed === "4") {
      reply = "Em breve um de nossos atendentes entrará em contato. Horário de atendimento: seg-sex 8h-18h.";
    } else if (trimmed === "5") {
      const hours = await repo.findAdminWorkingHours();
      const start = hours?.workdayStart ?? "08:00";
      const end = hours?.workdayEnd ?? "18:00";
      reply = `Nosso horário de funcionamento é de ${start} às ${end}, de segunda a sexta-feira.`;
    } else {
      reply = MENU_MESSAGE;
    }

    await sendText(phone, reply);

    await repo.saveMessage({
      id: crypto.randomUUID(),
      patientId,
      phone,
      direction: "outbound",
      content: reply,
    });

    await repo.upsertConversationState(phone, trimmed);
  }

  return {
    normalizePhone,

    verifyWebhookSignature(payload: Buffer, signature: string): void {
      if (!envConfig.WHATSAPP_APP_SECRET) {
        throw new AppError("WhatsApp not configured", 503);
      }
      const expected = crypto
        .createHmac("sha256", envConfig.WHATSAPP_APP_SECRET)
        .update(payload)
        .digest("hex");
      if (`sha256=${expected}` !== signature) {
        throw new AppError("Invalid signature", 401);
      }
    },

    async handleIncomingMessage(body: WebhookBody): Promise<void> {
      if (body.object !== "whatsapp_business_account") return;

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field !== "messages") continue;
          const messages = change.value.messages;
          if (!messages) continue;

          for (const message of messages) {
            if (message.type !== "text") continue;
            const textMsg = message as { id: string; from: string; text?: { body: string } };
            const text = textMsg.text?.body ?? "";

            processMessage(textMsg.from, text, textMsg.id).catch((err: unknown) => {
              logger.error({ err, from: textMsg.from, messageId: textMsg.id }, "Error processing WhatsApp message");
            });
          }
        }
      }
    },

    async sendTextMessage(phone: string, text: string): Promise<void> {
      await sendText(phone, text);
    },

    getStatus() {
      const configured =
        !!envConfig.WHATSAPP_ACCESS_TOKEN && !!envConfig.WHATSAPP_PHONE_NUMBER_ID;
      return { configured };
    },

    getHistory(params: { patientId?: string; page?: number; limit?: number }) {
      return repo.findMessagesWithPagination(params);
    },

    getMessagesByPhone(phone: string) {
      return repo.findMessagesByPhone(normalizePhone(phone));
    },
  };
}

export type WhatsappService = ReturnType<typeof createWhatsappService>;
