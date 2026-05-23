import crypto from "crypto";
import { AppError } from "../../shared/errors";
import { logger } from "../../infra/logger";
import { GRAPH_API_URL } from "../../config/whatsapp";
import { todayInSP } from "../../shared/utils/date";
import type { WhatsappRepository } from "./whatsapp.repository";
import type { Env } from "../../config/env";
import type { WebhookBody } from "./whatsapp.schema";

const MENU_MESSAGE = `Olá! 👋 Sou o assistente da Clínica. Como posso ajudar?

1️⃣ Marcar consulta
2️⃣ Ver minha próxima consulta
3️⃣ Confirmar consulta
4️⃣ Cancelar consulta
5️⃣ Falar com atendente
6️⃣ Horários de funcionamento`;

const DAY_NAMES_PT = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const SLOT_EMOJIS = [
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
];

// ── Conversation state ───────────────────────────

interface AnaData {
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
}

interface ConvState {
  step: string;
  name?: string;
  dob?: string;
  cep?: string;
  profId?: string | null;
  date?: string;
  time?: string;
  patientId?: string;
  apptId?: string;
  ana?: AnaData;
}

function parseState(str: string): ConvState {
  if (!str) return { step: "" };
  try {
    return JSON.parse(str) as ConvState;
  } catch {
    return { step: "" };
  }
}

function stateStr(s: ConvState): string {
  return s.step === "" ? "" : JSON.stringify(s);
}

// ── Display helpers ──────────────────────────────

function dateStrToDisplay(dateStr: string): string {
  const [y = 0, m = 0, d = 0] = dateStr.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAY_NAMES_PT[dow]}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

function buildDaySelectionMessage(days: string[]): string {
  const list = days
    .map(
      (day, i) => `${SLOT_EMOJIS[i] ?? `${i + 1}.`} ${dateStrToDisplay(day)}`,
    )
    .join("\n");
  return `Para marcar sua consulta, escolha um dia disponível:\n\n${list}\n\n0️⃣ Voltar ao menu`;
}

function buildTimeSelectionMessage(dateStr: string, slots: string[]): string {
  const list = slots
    .map((slot, i) => `${SLOT_EMOJIS[i] ?? `${i + 1}.`} ${slot}`)
    .join("\n");
  return `Horários disponíveis para ${dateStrToDisplay(dateStr)}:\n\n${list}\n\n0️⃣ Voltar (escolher outro dia)`;
}

function buildProfessionalSelectionMessage(
  profs: { id: string; fullName: string; specialty?: string | null }[],
): string {
  const list = profs
    .map(
      (p, i) =>
        `${SLOT_EMOJIS[i] ?? `${i + 1}.`} ${p.fullName}${p.specialty ? ` (${p.specialty})` : ""}`,
    )
    .join("\n");
  return `Com qual profissional você gostaria de ser atendido?\n\n${list}\n\n0️⃣ Voltar ao menu`;
}

function formatAppointmentDate(date: Date): string {
  const d = date.getUTCDate().toString().padStart(2, "0");
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const y = date.getUTCFullYear();
  const h = date.getUTCHours().toString().padStart(2, "0");
  const min = date.getUTCMinutes().toString().padStart(2, "0");
  return `${d}/${m}/${y} às ${h}:${min}`;
}

function isSkip(s: string): boolean {
  const l = s.toLowerCase().trim();
  return l === "0" || l === "não" || l === "nao" || l === "pular" || l === "n";
}

// ── Anamnesis question messages ──────────────────

const ANA_Q1_MSG = "Qual tipo de calçado você usa com mais frequência?";
const ANA_Q2_MSG = "Qual tipo de meia você usa com mais frequência?";
const ANA_Q3_MSG =
  "Pratica algum esporte? Se sim, qual? (ou 'não' para nenhum)";
const ANA_Q4_MSG =
  "Já realizou alguma cirurgia nos membros inferiores (pernas ou pés)?\n\n1️⃣ Sim\n2️⃣ Não";
const ANA_Q4B_MSG = "Por favor, descreva a cirurgia realizada:";
const ANA_Q5_MSG =
  "Usa algum medicamento regularmente? Se sim, qual? (ou 'não' para nenhum)";
const ANA_Q6_MSG =
  "Você possui alguma das condições abaixo?\nResponda com os números separados por vírgula (ex: 1,3) ou 0 para nenhuma:\n\n1️⃣ Gravidez\n2️⃣ Marca-passo ou pinos metálicos\n3️⃣ Hipertensão\n4️⃣ Convulsões\n5️⃣ Histórico de câncer\n6️⃣ Diabetes\n7️⃣ Problemas circulatórios\n8️⃣ Dificuldade de cicatrização\n0️⃣ Nenhuma";
const ANA_Q7_MSG =
  "Como você classifica sua sensibilidade à dor?\n\n1️⃣ Alta\n2️⃣ Moderada\n3️⃣ Baixa\n4️⃣ Nenhuma";
const ANA_Q8_MSG =
  "Possui algum problema dermatológico nos pés ou mãos? (ou 'não' para nenhum)";
const ANA_Q9_MSG = "Possui algum problema nas unhas? (ou 'não' para nenhum)";
const ANA_Q10_MSG =
  "Alguma outra observação relevante para o seu atendimento? (ou 'não' para nenhuma)";

// ────────────────────────────────────────────────

export function createWhatsappService(
  repo: WhatsappRepository,
  envConfig: Env,
) {
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
      logger.error(
        { status: response.status, body, to: phone },
        "WhatsApp API error",
      );
      throw new AppError(
        `WhatsApp API error ${response.status}: ${JSON.stringify(body)}`,
        502,
      );
    }
  }

  async function processMessage(
    from: string,
    text: string,
    messageId: string,
  ): Promise<void> {
    const phone = normalizePhone(from);
    const trimmed = text.trim();

    const alreadyProcessed = await repo.findMessageByExternalId(messageId);
    if (alreadyProcessed) return;

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

    const convStateRow = await repo.findConversationState(phone);
    const state = parseState(convStateRow?.state ?? "");
    const { step } = state;

    let reply = MENU_MESSAGE;
    let nextState: ConvState = { step: "" };

    // ── New patient: name ──────────────────────────
    if (step === "BOOKING_NAME") {
      if (trimmed === "0") {
        reply = MENU_MESSAGE;
      } else if (trimmed.length < 2) {
        reply = "Por favor, informe seu nome completo para continuar.";
        nextState = { step: "BOOKING_NAME" };
      } else {
        reply =
          "Qual a sua data de nascimento? (formato: dd/mm/aaaa, ou 0 para pular)";
        nextState = { step: "BOOKING_DOB", name: trimmed };
      }
    }

    // ── New patient: date of birth ─────────────────
    else if (step === "BOOKING_DOB") {
      if (trimmed === "0") {
        reply = "Qual o seu CEP? (ou 0 para pular)";
        nextState = { step: "BOOKING_CEP", name: state.name };
      } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        reply =
          "Formato inválido. Use dd/mm/aaaa (ex: 15/03/1985) ou 0 para pular.";
        nextState = { step: "BOOKING_DOB", name: state.name };
      } else {
        reply = "Qual o seu CEP? (ou 0 para pular)";
        nextState = { step: "BOOKING_CEP", name: state.name, dob: trimmed };
      }
    }

    // ── New patient: CEP ───────────────────────────
    else if (step === "BOOKING_CEP") {
      const cep = isSkip(trimmed) ? undefined : trimmed;
      const profs = await repo.findActiveProfessionals();
      if (profs.length === 0) {
        const days = await repo.findAvailableDays(todayInSP());
        if (days.length === 0) {
          reply =
            "Não há horários disponíveis nos próximos dias. Entre em contato com a clínica para agendar.";
        } else {
          reply = buildDaySelectionMessage(days);
          nextState = {
            step: "BOOKING_DAY",
            name: state.name,
            dob: state.dob,
            cep,
            profId: null,
          };
        }
      } else {
        reply = buildProfessionalSelectionMessage(profs);
        nextState = {
          step: "BOOKING_PROF_NEW",
          name: state.name,
          dob: state.dob,
          cep,
        };
      }
    }

    // ── Professional selection (new patient) ───────
    else if (step === "BOOKING_PROF_NEW") {
      if (trimmed === "0") {
        reply = MENU_MESSAGE;
      } else {
        const profs = await repo.findActiveProfessionals();
        const idx = parseInt(trimmed, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= profs.length) {
          reply = `Opção inválida. Por favor escolha um número da lista.\n\n${buildProfessionalSelectionMessage(profs)}`;
          nextState = { ...state };
        } else {
          const prof = profs[idx]!;
          const days = await repo.findAvailableDays(todayInSP());
          if (days.length === 0) {
            reply =
              "Não há horários disponíveis nos próximos dias. Entre em contato com a clínica.";
          } else {
            reply = buildDaySelectionMessage(days);
            nextState = {
              step: "BOOKING_DAY",
              name: state.name,
              dob: state.dob,
              cep: state.cep,
              profId: prof.id,
            };
          }
        }
      }
    }

    // ── Professional selection (existing patient) ──
    else if (step === "BOOKING_PROF_EX") {
      if (trimmed === "0") {
        reply = MENU_MESSAGE;
      } else {
        const profs = await repo.findActiveProfessionals();
        const idx = parseInt(trimmed, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= profs.length) {
          reply = `Opção inválida. Por favor escolha um número da lista.\n\n${buildProfessionalSelectionMessage(profs)}`;
          nextState = { step: "BOOKING_PROF_EX" };
        } else {
          const prof = profs[idx]!;
          const days = await repo.findAvailableDays(todayInSP());
          if (days.length === 0) {
            reply =
              "Não há horários disponíveis nos próximos dias. Entre em contato com a clínica.";
          } else {
            reply = buildDaySelectionMessage(days);
            nextState = { step: "BOOKING_DAY", profId: prof.id };
          }
        }
      }
    }

    // ── Select day ─────────────────────────────────
    else if (step === "BOOKING_DAY") {
      if (trimmed === "0") {
        reply = MENU_MESSAGE;
      } else {
        const days = await repo.findAvailableDays(todayInSP());
        const idx = parseInt(trimmed, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= days.length) {
          reply = `Opção inválida. Por favor escolha um número da lista.\n\n${buildDaySelectionMessage(days)}`;
          nextState = { ...state };
        } else {
          const selectedDate = days[idx]!;
          const slots = await repo.findAvailableTimeSlots(selectedDate);
          if (slots.length === 0) {
            const remaining = days.filter((_, i) => i !== idx);
            reply =
              remaining.length > 0
                ? `Não há mais horários para ${dateStrToDisplay(selectedDate)}. Escolha outro dia:\n\n${buildDaySelectionMessage(remaining)}`
                : "Não há mais horários disponíveis nos próximos dias. Entre em contato com a clínica.";
            nextState = remaining.length > 0 ? { ...state } : { step: "" };
          } else {
            reply = buildTimeSelectionMessage(selectedDate, slots);
            nextState = { ...state, step: "BOOKING_TIME", date: selectedDate };
          }
        }
      }
    }

    // ── Select time slot ───────────────────────────
    else if (step === "BOOKING_TIME") {
      if (trimmed === "0") {
        const days = await repo.findAvailableDays(todayInSP());
        reply =
          days.length > 0
            ? buildDaySelectionMessage(days)
            : "Não há dias disponíveis. Entre em contato com a clínica.";
        const { date: _date, ...withoutDate } = state;
        nextState = { ...withoutDate, step: "BOOKING_DAY" };
      } else {
        const slots = await repo.findAvailableTimeSlots(state.date!);
        const idx = parseInt(trimmed, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= slots.length) {
          reply = `Opção inválida. Por favor escolha um número da lista.\n\n${buildTimeSelectionMessage(state.date!, slots)}`;
          nextState = { ...state };
        } else {
          reply =
            "Qual o motivo da sua consulta? (descreva brevemente, ou 0 para pular)";
          nextState = { ...state, step: "BOOKING_REASON", time: slots[idx] };
        }
      }
    }

    // ── Chief complaint & create appointment ───────
    else if (step === "BOOKING_REASON") {
      const reason = isSkip(trimmed) ? null : trimmed;
      try {
        const resolvedPatientId =
          patientId ??
          (state.name
            ? (
                await repo.findOrCreatePatientByPhone(
                  phone,
                  state.name,
                  state.dob,
                  state.cep,
                )
              ).id
            : null);
        if (!resolvedPatientId) {
          reply =
            "Não encontramos uma conta associada a este número. Entre em contato com a clínica.";
        } else {
          const appt = await repo.createAppointmentForPatient({
            patientId: resolvedPatientId,
            dateStr: state.date!,
            timeSlot: state.time!,
            professionalId: state.profId ?? null,
            chiefComplaint: reason,
          });
          if (state.profId) {
            await repo
              .linkPatientToProfessional(resolvedPatientId, state.profId)
              .catch((err) =>
                logger.warn(
                  { err },
                  "WhatsApp: falha ao vincular profissional",
                ),
              );
          }
          const hasAnamnesis = await repo.findAnamnesisForPatient(resolvedPatientId);
          if (hasAnamnesis) {
            reply = `✅ Consulta marcada com sucesso!\n\n📅 ${dateStrToDisplay(state.date!)} às ${state.time}\n\nAguardamos você! 😊`;
          } else {
            reply = `✅ Consulta marcada com sucesso!\n\n📅 ${dateStrToDisplay(state.date!)} às ${state.time}\n\nAguardamos você! 😊\n\n───────────────\nAgora vamos preencher sua ficha de anamnese para melhor atendê-lo.\n\n${ANA_Q1_MSG}`;
            nextState = {
              step: "ANA_Q1",
              patientId: resolvedPatientId,
              apptId: appt.id,
              ana: {},
            };
          }
        }
      } catch (err) {
        logger.error({ err }, "WhatsApp: falha ao criar consulta");
        reply =
          "Não foi possível marcar a consulta. Entre em contato com a clínica.";
      }
    }

    // ── Anamnesis: footwear ────────────────────────
    else if (step === "ANA_Q1") {
      nextState = {
        ...state,
        step: "ANA_Q2",
        ana: { ...(state.ana ?? {}), footwear: trimmed },
      };
      reply = ANA_Q2_MSG;
    }

    // ── Anamnesis: socks ──────────────────────────
    else if (step === "ANA_Q2") {
      nextState = {
        ...state,
        step: "ANA_Q3",
        ana: { ...(state.ana ?? {}), socks: trimmed },
      };
      reply = ANA_Q3_MSG;
    }

    // ── Anamnesis: sports ─────────────────────────
    else if (step === "ANA_Q3") {
      const sports = isSkip(trimmed) ? undefined : trimmed;
      nextState = {
        ...state,
        step: "ANA_Q4",
        ana: { ...(state.ana ?? {}), sports },
      };
      reply = ANA_Q4_MSG;
    }

    // ── Anamnesis: lower limb surgery ─────────────
    else if (step === "ANA_Q4") {
      if (trimmed === "1") {
        nextState = {
          ...state,
          step: "ANA_Q4B",
          ana: { ...(state.ana ?? {}), hasLowerLimbSurgery: true },
        };
        reply = ANA_Q4B_MSG;
      } else if (trimmed === "2") {
        nextState = {
          ...state,
          step: "ANA_Q5",
          ana: { ...(state.ana ?? {}), hasLowerLimbSurgery: false },
        };
        reply = ANA_Q5_MSG;
      } else {
        reply = `Opção inválida.\n\n${ANA_Q4_MSG}`;
        nextState = { ...state };
      }
    }

    // ── Anamnesis: surgery details ─────────────────
    else if (step === "ANA_Q4B") {
      nextState = {
        ...state,
        step: "ANA_Q5",
        ana: { ...(state.ana ?? {}), lowerLimbSurgeryDetails: trimmed },
      };
      reply = ANA_Q5_MSG;
    }

    // ── Anamnesis: medications ────────────────────
    else if (step === "ANA_Q5") {
      const meds = isSkip(trimmed) ? undefined : trimmed;
      nextState = {
        ...state,
        step: "ANA_Q6",
        ana: { ...(state.ana ?? {}), medicationsInUse: meds },
      };
      reply = ANA_Q6_MSG;
    }

    // ── Anamnesis: conditions multi-select ─────────
    else if (step === "ANA_Q6") {
      const nums =
        trimmed === "0"
          ? []
          : trimmed
              .split(",")
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => !isNaN(n) && n >= 1 && n <= 8);
      nextState = {
        ...state,
        step: "ANA_Q7",
        ana: {
          ...(state.ana ?? {}),
          isPregnant: nums.includes(1),
          hasPacemakerOrPins: nums.includes(2),
          hasHypertension: nums.includes(3),
          hasSeizures: nums.includes(4),
          hasCancerHistory: nums.includes(5),
          hasDiabetes: nums.includes(6),
          hasCirculatoryProblems: nums.includes(7),
          hasHealingProblems: nums.includes(8),
        },
      };
      reply = ANA_Q7_MSG;
    }

    // ── Anamnesis: pain sensitivity ───────────────
    else if (step === "ANA_Q7") {
      const painMap: Record<string, string> = {
        "1": "high",
        "2": "moderate",
        "3": "low",
        "4": "none",
      };
      if (!painMap[trimmed]) {
        reply = `Opção inválida.\n\n${ANA_Q7_MSG}`;
        nextState = { ...state };
      } else {
        nextState = {
          ...state,
          step: "ANA_Q8",
          ana: { ...(state.ana ?? {}), painSensitivity: painMap[trimmed] },
        };
        reply = ANA_Q8_MSG;
      }
    }

    // ── Anamnesis: dermatological ──────────────────
    else if (step === "ANA_Q8") {
      const dermato = isSkip(trimmed) ? undefined : trimmed;
      nextState = {
        ...state,
        step: "ANA_Q9",
        ana: { ...(state.ana ?? {}), dermatologicalPathologies: dermato },
      };
      reply = ANA_Q9_MSG;
    }

    // ── Anamnesis: nail pathologies ───────────────
    else if (step === "ANA_Q9") {
      const nails = isSkip(trimmed) ? undefined : trimmed;
      nextState = {
        ...state,
        step: "ANA_Q10",
        ana: { ...(state.ana ?? {}), nailPathologies: nails },
      };
      reply = ANA_Q10_MSG;
    }

    // ── Anamnesis: final question & save ──────────
    else if (step === "ANA_Q10") {
      const other = isSkip(trimmed) ? undefined : trimmed;
      const finalAna = { ...(state.ana ?? {}), otherObservations: other };
      if (state.patientId) {
        try {
          await repo.createAnamnesis({
            patientId: state.patientId,
            ...finalAna,
          });
          reply =
            "✅ Ficha de anamnese preenchida com sucesso! Obrigado pela colaboração.\n\nNos vemos na consulta! 🦶";
        } catch (err) {
          logger.error({ err }, "WhatsApp: falha ao salvar anamnese");
          reply =
            "Sua consulta está confirmada! Houve um problema ao salvar a ficha — nossa equipe irá atualizá-la na chegada. 😊";
        }
      } else {
        reply = "✅ Obrigado! Nos vemos na consulta! 🦶";
      }
    }

    // ── Main menu ─────────────────────────────────
    else if (trimmed === "1") {
      if (patientId) {
        const profs = await repo.findActiveProfessionals();
        if (profs.length === 0) {
          const days = await repo.findAvailableDays(todayInSP());
          if (days.length === 0) {
            reply =
              "Não há horários disponíveis nos próximos dias. Entre em contato com a clínica para agendar.";
          } else {
            reply = buildDaySelectionMessage(days);
            nextState = { step: "BOOKING_DAY", profId: null };
          }
        } else {
          reply = buildProfessionalSelectionMessage(profs);
          nextState = { step: "BOOKING_PROF_EX" };
        }
      } else {
        reply =
          "Para marcar sua consulta, por favor nos diga seu nome completo:";
        nextState = { step: "BOOKING_NAME" };
      }
    } else if (trimmed === "2") {
      if (!patientId) {
        reply =
          "Não encontramos uma conta associada a este número. Entre em contato com a clínica.";
      } else {
        const appt = await repo.findNextAppointment(patientId);
        reply = appt
          ? `Sua próxima consulta está marcada para ${formatAppointmentDate(appt.scheduledStart)}.`
          : "Você não possui consultas agendadas no momento.";
      }
    } else if (trimmed === "3") {
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
    } else if (trimmed === "4") {
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
    } else if (trimmed === "5") {
      reply =
        "Em breve um de nossos atendentes entrará em contato. Horário de atendimento: seg-sex 8h-18h.";
    } else if (trimmed === "6") {
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

    await repo.upsertConversationState(phone, stateStr(nextState));
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
            const textMsg = message as {
              id: string;
              from: string;
              text?: { body: string };
            };
            const text = textMsg.text?.body ?? "";

            processMessage(textMsg.from, text, textMsg.id).catch(
              (err: unknown) => {
                logger.error(
                  { err, from: textMsg.from, messageId: textMsg.id },
                  "Error processing WhatsApp message",
                );
              },
            );
          }
        }
      }
    },

    async sendTextMessage(phone: string, text: string): Promise<void> {
      await sendText(phone, text);
    },

    getStatus() {
      const configured =
        !!envConfig.WHATSAPP_ACCESS_TOKEN &&
        !!envConfig.WHATSAPP_PHONE_NUMBER_ID;
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
