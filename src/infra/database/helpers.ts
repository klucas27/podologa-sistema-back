import type { RowDataPacket } from "mysql2";

// snake_case → camelCase
function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

// camelCase → snake_case
export function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

// Converte uma row com chaves snake_case para objeto com camelCase
export function mapRow<T>(row: RowDataPacket): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[toCamel(k)] = v;
  }
  return out as T;
}

export function mapRows<T>(rows: RowDataPacket[]): T[] {
  return rows.map((r) => mapRow<T>(r));
}

type SqlValue = string | number | bigint | boolean | Date | null | Buffer | Uint8Array;

// Converte booleanos para 0/1 (MySQL TINYINT)
function normaliseValue(v: unknown): SqlValue {
  if (typeof v === "boolean") return v ? 1 : 0;
  return v as SqlValue;
}

const SAFE_COL = /^[a-z0-9_]+$/;

function assertSafeColumn(col: string): void {
  if (!SAFE_COL.test(col)) throw new Error(`Coluna inválida: ${col}`);
}

// Constrói SET clause para UPDATE, convertendo chaves camelCase → snake_case
export function buildSet(data: Record<string, unknown>): {
  clause: string;
  values: SqlValue[];
} {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  return {
    clause: entries.map(([k]) => {
      const col = toSnake(k);
      assertSafeColumn(col);
      return `\`${col}\` = ?`;
    }).join(", "),
    values: entries.map(([, v]) => normaliseValue(v)),
  };
}

// Constrói placeholders e valores para INSERT
export function buildInsert(data: Record<string, unknown>): {
  columns: string;
  placeholders: string;
  values: SqlValue[];
} {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  return {
    columns: entries.map(([k]) => {
      const col = toSnake(k);
      assertSafeColumn(col);
      return `\`${col}\``;
    }).join(", "),
    placeholders: entries.map(() => "?").join(", "),
    values: entries.map(([, v]) => normaliseValue(v)),
  };
}
