import type { PrismaClient, MessageDirection, MessageStatus } from "@prisma/client";
import { nowSP } from "../../shared/utils/date";

export interface SaveMessageData {
  id: string;
  patientId: string | null;
  phone: string;
  direction: MessageDirection;
  content: string;
  status?: MessageStatus;
  externalId?: string | null;
}

export function createWhatsappRepository(prisma: PrismaClient) {
  return {
    findPatientByPhone(phone: string) {
      return prisma.patient.findFirst({
        where: { phoneNumber: phone },
      });
    },

    findNextAppointment(patientId: string) {
      return prisma.appointment.findFirst({
        where: {
          patientId,
          deletedAt: null,
          status: { in: ["scheduled", "confirmed"] },
          scheduledStart: { gte: nowSP() },
        },
        orderBy: { scheduledStart: "asc" },
      });
    },

    updateAppointmentStatus(id: string, status: "confirmed" | "cancelled") {
      return prisma.appointment.update({
        where: { id },
        data: { status },
      });
    },

    findAdminWorkingHours() {
      return prisma.user.findFirst({
        where: { role: "admin", deletedAt: null },
        select: { workdayStart: true, workdayEnd: true },
      });
    },

    saveMessage(data: SaveMessageData) {
      return prisma.whatsappMessage.create({
        data: {
          id: data.id,
          patientId: data.patientId,
          phone: data.phone,
          direction: data.direction,
          content: data.content,
          status: data.status ?? "sent",
          externalId: data.externalId ?? null,
        },
      });
    },

    findConversationState(phone: string) {
      return prisma.whatsappConversationState.findUnique({
        where: { phone },
      });
    },

    upsertConversationState(phone: string, state: string) {
      return prisma.whatsappConversationState.upsert({
        where: { phone },
        update: { state },
        create: { phone, state },
      });
    },

    findMessagesByPhone(phone: string, limit = 10) {
      return prisma.whatsappMessage.findMany({
        where: { phone },
        include: { patient: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    },

    findMessagesWithPagination(params: {
      patientId?: string;
      page?: number;
      limit?: number;
    }) {
      const { patientId, page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;
      return prisma.whatsappMessage.findMany({
        where: patientId ? { patientId } : {},
        include: { patient: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });
    },
  };
}

export type WhatsappRepository = ReturnType<typeof createWhatsappRepository>;
