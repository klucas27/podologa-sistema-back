function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeOutput<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return escapeHtml(obj) as unknown as T;
  }

  if (typeof obj === "number" || typeof obj === "boolean") return obj;

  if (obj instanceof Date) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeOutput(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = sanitizeOutput(v as unknown);
    }
    return out as T;
  }

  return obj;
}
