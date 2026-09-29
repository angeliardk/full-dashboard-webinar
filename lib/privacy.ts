/**
 * Email/NIP/phone must never appear on the general analytics dashboard, and
 * must be masked even on the admin/audit pages. Names are allowed (this is
 * an internal dashboard) — only contact-identifying fields are masked.
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "-";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "*".repeat(digits.length);
  return `${digits.slice(0, 3)}${"*".repeat(digits.length - 6)}${digits.slice(-3)}`;
}

export function maskNip(nip: string | null | undefined): string {
  if (!nip) return "-";
  if (nip.length <= 4) return "*".repeat(nip.length);
  return `${nip.slice(0, 2)}${"*".repeat(nip.length - 4)}${nip.slice(-2)}`;
}

export function maskRawValue(key: string, value: unknown): unknown {
  const k = key.toLowerCase();
  if (k.includes("email")) return maskEmail(String(value ?? ""));
  if (k.includes("hp") || k.includes("phone") || k.includes("telepon")) return maskPhone(String(value ?? ""));
  if (k.includes("nip")) return maskNip(String(value ?? ""));
  return value;
}

/** Masks every email/NIP/phone-like key in a raw imported row before it is ever rendered. */
export function maskRawRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) out[key] = maskRawValue(key, value);
  return out;
}
