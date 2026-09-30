/**
 * Value + header normalization shared by every Excel adapter.
 * Keeping this in one place is what lets a single canonical template
 * adapter also understand the Webinar 3 file without renaming columns.
 */

const EMPTYISH = new Set(["", "-", "null", "n/a", "na", "nan", "undefined", "none"]);

export function normalizeHeaderKey(header: string): string {
  return header
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[?*.]/g, "")
    .replace(/\s+/g, " ");
}

export function isEmptyish(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "number") return Number.isNaN(value);
  const s = String(value).trim().toLowerCase();
  return EMPTYISH.has(s);
}

export function cleanString(value: unknown): string | null {
  if (isEmptyish(value)) return null;
  return String(value).trim().replace(/\s+/g, " ");
}

const TRUE_TOKENS = new Set(["ya", "yes", "true", "1", "y", "hadir", "benar"]);
const FALSE_TOKENS = new Set(["tidak", "no", "false", "0", "n", "belum", "salah"]);

export function parseBoolean(value: unknown): boolean | null {
  if (isEmptyish(value)) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value).trim().toLowerCase();
  if (TRUE_TOKENS.has(s)) return true;
  if (FALSE_TOKENS.has(s)) return false;
  return null;
}

export function parseNumber(value: unknown): number | null {
  if (isEmptyish(value)) return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  const s = String(value).trim().replace(/\./g, "").replace(",", ".");
  const asIs = Number(String(value).trim());
  if (!Number.isNaN(asIs) && String(value).trim() !== "") return asIs;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

/** NIP / phone numbers must never round-trip through a float. */
export function parseIdentifierString(value: unknown): string | null {
  if (isEmptyish(value)) return null;
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    return String(value);
  }
  return String(value).trim();
}

export function normalizeEmail(value: unknown): string | null {
  const s = cleanString(value);
  if (!s) return null;
  const lower = s.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower) ? lower : null;
}

export function isValidEmail(value: string | null): value is string {
  return !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidNip(value: string | null): value is string {
  return !!value && value.length >= 4 && value.toLowerCase() !== "n/a";
}

const MONTHS_ID: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
};

/** Handles Excel serial dates, JS Date objects, "DD/MM/YYYY HH:mm:ss" and Indonesian text dates. */
export function parseTimestamp(value: unknown): string | null {
  if (isEmptyish(value)) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    // Excel serial date (days since 1899-12-30)
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(value).trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (dmy) {
    const [, d, m, y, h, mi, se] = dmy;
    // These exports (Google Forms / quiz submission logs) record wall-clock
    // time in WIB (UTC+7). Build the UTC instant directly instead of using
    // `new Date(y, m, d, h, mi, s)`, which reads those numbers in the
    // *runtime's* local timezone -- UTC in this deployment -- and would
    // silently mislabel a WIB time as if it were already UTC (so it then
    // renders 7 hours late wherever the UI correctly converts to WIB).
    const utcMs = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(h) - 7, Number(mi), Number(se ?? 0));
    const date = new Date(utcMs);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const idText = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (idText) {
    const [, d, monthName, y] = idText;
    const month = MONTHS_ID[monthName.toLowerCase()];
    if (month) {
      const date = new Date(Number(y), month - 1, Number(d));
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
  }
  const generic = new Date(s);
  return Number.isNaN(generic.getTime()) ? null : generic.toISOString();
}

export function normalizeUnit(value: unknown): string {
  const s = cleanString(value);
  return s ?? "Tidak Teridentifikasi";
}
