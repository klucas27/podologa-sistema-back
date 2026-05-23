import crypto from "crypto";
import type { PrismaClient, MessageDirection, MessageStatus } from "@prisma/client";
import { nowSP, toDateOnly } from "../../shared/utils/date";

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

    findMessageByExternalId(externalId: string) {
      return prisma.whatsappMessage.findUnique({
        where: { externalId },
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

    async findAvailableDays(todayStr: string): Promise<string[]> {
      const admin = await prisma.user.findFirst({
        where: { role: "admin", deletedAt: null },
        select: { workdayStart: true, workdayEnd: true },
      });
      const startH = parseInt(admin?.workdayStart?.split(":")[0] ?? "8", 10);
      const endH = parseInt(admin?.workdayEnd?.split(":")[0] ?? "18", 10);
      const slotsPerDay = endH - startH;

      const [ty = 0, tm = 0, td = 0] = todayStr.split("-").map(Number);
      const rangeStart = new Date(Date.UTC(ty, tm - 1, td + 1, startH, 0, 0, 0));
      const rangeEnd = new Date(Date.UTC(ty, tm - 1, td + 15, endH, 0, 0, 0));

      const booked = await prisma.appointment.findMany({
        where: {
          scheduledStart: { gte: rangeStart, lt: rangeEnd },
          deletedAt: null,
          status: { not: "cancelled" },
        },
        select: { scheduledStart: true },
      });

      const bookedByDay = new Map<string, number>();
      for (const appt of booked) {
        const y = appt.scheduledStart.getUTCFullYear();
        const m = String(appt.scheduledStart.getUTCMonth() + 1).padStart(2, "0");
        const d = String(appt.scheduledStart.getUTCDate()).padStart(2, "0");
        const key = `${y}-${m}-${d}`;
        bookedByDay.set(key, (bookedByDay.get(key) ?? 0) + 1);
      }

      const result: string[] = [];
      const cursor = new Date(Date.UTC(ty, tm - 1, td + 1, 0, 0, 0, 0)); // start tomorrow
      while (cursor < rangeEnd && result.length < 5) {
        const dow = cursor.getUTCDay();
        if (dow >= 1 && dow <= 5) {
          const y = cursor.getUTCFullYear();
          const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
          const d = String(cursor.getUTCDate()).padStart(2, "0");
          const key = `${y}-${m}-${d}`;
          if ((bookedByDay.get(key) ?? 0) < slotsPerDay) {
            result.push(key);
          }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      return result;
    },

    async findAvailableTimeSlots(dateStr: string): Promise<string[]> {
      const admin = await prisma.user.findFirst({
        where: { role: "admin", deletedAt: null },
        select: { workdayStart: true, workdayEnd: true },
      });
      const startH = parseInt(admin?.workdayStart?.split(":")[0] ?? "8", 10);
      const endH = parseInt(admin?.workdayEnd?.split(":")[0] ?? "18", 10);

      const [y = 0, m = 0, d = 0] = dateStr.split("-").map(Number);
      const dayStart = new Date(Date.UTC(y, m - 1, d, startH, 0, 0, 0));
      const dayEnd = new Date(Date.UTC(y, m - 1, d, endH, 0, 0, 0));

      const booked = await prisma.appointment.findMany({
        where: {
          scheduledStart: { gte: dayStart, lt: dayEnd },
          deletedAt: null,
          status: { not: "cancelled" },
        },
        select: { scheduledStart: true, scheduledEnd: true },
      });

      const available: string[] = [];
      for (let h = startH; h < endH; h++) {
        const slotStart = new Date(Date.UTC(y, m - 1, d, h, 0, 0, 0));
        const slotEnd = new Date(Date.UTC(y, m - 1, d, h + 1, 0, 0, 0));
        const hasConflict = booked.some(
          (a) => a.scheduledStart < slotEnd && a.scheduledEnd > slotStart,
        );
        if (!hasConflict) {
          available.push(`${String(h).padStart(2, "0")}:00`);
        }
      }
      return available;
    },

    async findOrCreatePatientByPhone(
      phone: string,
      fullName: string,
      dob?: string,
      cep?: string,
    ) {
      const existing = await prisma.patient.findFirst({
        where: { phoneNumber: phone },
      });
      if (existing) return existing;

      const admin = await prisma.user.findFirst({
        where: { role: "admin", deletedAt: null },
        select: { id: true },
      });
      if (!admin) throw new Error("Administrador não encontrado");

      let dateOfBirth: Date | null = null;
      if (dob) {
        const [dd = 0, mm = 0, yyyy = 0] = dob.split("/").map(Number);
        dateOfBirth = new Date(Date.UTC(yyyy, mm - 1, dd));
      }

      return prisma.patient.create({
        data: {
          id: crypto.randomUUID(),
          adminId: admin.id,
          fullName,
          phoneNumber: phone,
          dateOfBirth,
          zipCode: cep ?? null,
        },
      });
    },

    async createAppointmentForPatient(data: {
      patientId: string;
      dateStr: string;
      timeSlot: string;
      professionalId?: string | null;
      chiefComplaint?: string | null;
    }) {
      const admin = await prisma.user.findFirst({
        where: { role: "admin", deletedAt: null },
        select: { id: true },
      });
      if (!admin) throw new Error("Administrador não encontrado");

      const [y = 0, m = 0, d = 0] = data.dateStr.split("-").map(Number);
      const [h = 0] = data.timeSlot.split(":").map(Number);

      const scheduledStart = new Date(Date.UTC(y, m - 1, d, h, 0, 0, 0));
      const scheduledEnd = new Date(Date.UTC(y, m - 1, d, h + 1, 0, 0, 0));
      const scheduledDate = toDateOnly(data.dateStr);

      return prisma.appointment.create({
        data: {
          id: crypto.randomUUID(),
          patientId: data.patientId,
          userId: admin.id,
          professionalId: data.professionalId ?? null,
          scheduledStart,
          scheduledEnd,
          scheduledDate,
          status: "scheduled",
          chiefComplaint: data.chiefComplaint ?? null,
        },
      });
    },

    findActiveProfessionals() {
      return prisma.professional.findMany({
        where: { isActive: true, deletedAt: null },
        select: { id: true, fullName: true, specialty: true },
        orderBy: { fullName: "asc" },
      });
    },

    findAnamnesisForPatient(patientId: string) {
      return prisma.anamnesis.findFirst({
        where: { patientId, deletedAt: null },
        select: { id: true },
      });
    },

    linkPatientToProfessional(patientId: string, professionalId: string) {
      return prisma.patientProfessional.upsert({
        where: { patientId_professionalId: { patientId, professionalId } },
        update: {},
        create: { patientId, professionalId },
      });
    },

    async deleteOldMessageHistory(): Promise<number> {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const active = await prisma.whatsappMessage.findMany({
        where: { direction: "inbound", createdAt: { gte: cutoff } },
        select: { phone: true },
        distinct: ["phone"],
      });
      const activeSet = new Set(active.map((m) => m.phone));

      const all = await prisma.whatsappMessage.findMany({
        select: { phone: true },
        distinct: ["phone"],
      });

      const stale = all.map((m) => m.phone).filter((p) => !activeSet.has(p));
      if (stale.length === 0) return 0;

      await prisma.whatsappConversationState.deleteMany({
        where: { phone: { in: stale } },
      });
      const { count } = await prisma.whatsappMessage.deleteMany({
        where: { phone: { in: stale } },
      });
      return count;
    },

    createAnamnesis(data: {
      patientId: string;
      footwear?: string;
      socks?: string;
      sports?: string;
      hasLowerLimbSurgery?: boolean;
      lowerLimbSurgeryDetails?: string;
      medicationsInUse?: string;
      isPregnant?: boolean;
      hasPacemakerOrPins?: boolean;
      hasHypertension?: boolean;
      hasSeizures?: boolean;
      hasCancerHistory?: boolean;
      hasDiabetes?: boolean;
      hasCirculatoryProblems?: boolean;
      hasHealingProblems?: boolean;
      painSensitivity?: string;
      dermatologicalPathologies?: string;
      nailPathologies?: string;
      otherObservations?: string;
    }) {
      return prisma.anamnesis.create({
        data: {
          id: crypto.randomUUID(),
          patientId: data.patientId,
          frequentlyUsedFootwear: data.footwear ?? null,
          frequentlyUsedSocks: data.socks ?? null,
          practicedSports: data.sports ?? null,
          hasLowerLimbSurgery: data.hasLowerLimbSurgery ?? false,
          lowerLimbSurgeryDetails: data.lowerLimbSurgeryDetails ?? null,
          medicationsInUse: data.medicationsInUse ?? null,
          isPregnant: data.isPregnant ?? false,
          hasPacemakerOrPins: data.hasPacemakerOrPins ?? false,
          hasHypertension: data.hasHypertension ?? false,
          hasSeizures: data.hasSeizures ?? false,
          hasCancerHistory: data.hasCancerHistory ?? false,
          hasDiabetes: data.hasDiabetes ?? false,
          hasCirculatoryProblems: data.hasCirculatoryProblems ?? false,
          hasHealingProblems: data.hasHealingProblems ?? false,
          painSensitivity: (data.painSensitivity ?? "none") as
            | "high"
            | "moderate"
            | "low"
            | "none",
          dermatologicalPathologies: data.dermatologicalPathologies ?? null,
          nailPathologies: data.nailPathologies ?? null,
          otherObservations: data.otherObservations ?? null,
        },
      });
    },
  };
}

export type WhatsappRepository = ReturnType<typeof createWhatsappRepository>;
