/**
 * Utilitário central de datas — Backend (Fonte da Verdade)
 *
 * Estratégia: Armazenar TODAS as datas em horário de São Paulo.
 * O banco grava o valor EXATO que o usuário vê (America/Sao_Paulo).
 *
 * Internamente, as funções criam objetos Date cujos slots UTC contêm
 * os valores de SP. Assim, quando Prisma envia ao MySQL, o valor
 * armazenado é o horário de SP — sem conversão.
 *
 * - `nowSP()` — substitui `new Date()` em todo o backend
 * - `toDateOnly()` — normaliza para DATE (meio-dia, evita day shift)
 * - `toDate()` — converte string para Date (sem manipulação)
 * - `startOfDaySP()` / `endOfDaySP()` — limites de dia
 * - `startOfWeekSP()` / `startOfMonthSP()` / `startOfYearSP()` — períodos
 */

const TZ = "America/Sao_Paulo";

// ── Helper interno: componentes de "agora" em SP ─────────────

function currentSPComponents(): {
  year: number; month: number; day: number;
  hours: number; minutes: number; seconds: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hours: get("hour"),
    minutes: get("minute"),
    seconds: get("second"),
  };
}

/**
 * Retorna o instante atual em horário de São Paulo.
 * Única fonte de "agora" no backend.
 */
export function nowSP(): Date {
  const c = currentSPComponents();
  return new Date(Date.UTC(c.year, c.month - 1, c.day, c.hours, c.minutes, c.seconds));
}

/**
 * Converte string/Date em Date ao meio-dia.
 * Usado para colunas DATE do banco — evita troca de dia.
 */
export function toDateOnly(value: string | Date): Date {
  const iso =
    typeof value === "string"
      ? value.slice(0, 10)
      : value.toISOString().slice(0, 10);
  return new Date(`${iso}T12:00:00Z`);
}

/** Converte string para Date (sem manipulação adicional). */
export function toDate(value: string): Date {
  return new Date(value);
}

/** Data de hoje em São Paulo no formato "YYYY-MM-DD" */
export function todayInSP(): string {
  const d = nowSP();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Início do dia (00:00:00.000).
 * Como as datas no sistema já estão em SP (slots UTC = SP), basta
 * zerar horas usando getUTC*.
 */
export function startOfDaySP(date?: Date): Date {
  const d = date ?? nowSP();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** Fim do dia (23:59:59.999) */
export function endOfDaySP(date?: Date): Date {
  const d = date ?? nowSP();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

/** Início da semana (domingo 00:00:00) */
export function startOfWeekSP(date?: Date): Date {
  const d = date ?? nowSP();
  const dayOfMonth = d.getUTCDate();
  const dow = d.getUTCDay();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), dayOfMonth - dow, 0, 0, 0, 0));
}

/** Início do mês (dia 1, 00:00:00) */
export function startOfMonthSP(date?: Date): Date {
  const d = date ?? nowSP();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

/** Início do ano (1 jan, 00:00:00) */
export function startOfYearSP(date?: Date): Date {
  const d = date ?? nowSP();
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
}

/** Formata hora → "HH:MM" */
export function formatTimeSP(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Extrai hora (número inteiro) */
export function getHourInSP(date: Date): number {
  return date.getUTCHours();
}

/** Extrai dia da semana (0=Dom) */
export function getDayOfWeekInSP(date: Date): number {
  return date.getUTCDay();
}

/** Extrai dia do mês */
export function getDayInSP(date: Date): number {
  return date.getUTCDate();
}

/** Extrai mês (0-indexed) */
export function getMonthInSP(date: Date): number {
  return date.getUTCMonth();
}
