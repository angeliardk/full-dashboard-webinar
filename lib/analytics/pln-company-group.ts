import type { Participant } from "@/types/webinar";
import type { UnitDistributionRow } from "@/types/analytics";
import { activeParticipants, UNIDENTIFIED_UNIT } from "./helpers";

/**
 * Coarse "PLN Pusat vs anak perusahaan PLN" grouping, layered on top of the
 * detailed unitFinal string rather than replacing it -- every specific
 * division/regional office (UIP/UID/UIT/... or an internal center like
 * Puslitbang) still rolls up to "PLN Pusat" here, since legally they're part
 * of PT PLN (Persero) itself, not a separate subsidiary. Order matters:
 * "Nusantara Power Services" must be checked before "Nusantara Power" since
 * the latter is a substring of the former.
 */
const SUBSIDIARY_RULES: { name: string; pattern: RegExp }[] = [
  { name: "PLN Nusantara Power Services", pattern: /nusantara\s*power\s*services?\b|\bnps\b/i },
  { name: "PLN Nusantara Power", pattern: /nusantara\s*power\b|\bplnnp\b|\bpln\s*np\b/i },
  { name: "PLN Indonesia Power", pattern: /indonesia\s*power\b|\bplnip\b|\bpln\s*ip\b/i },
  { name: "PLN Enjiniring", pattern: /enjiniring\b/i },
  { name: "PLN Icon Plus", pattern: /icon\s*plus\b/i },
  { name: "PLN Batam", pattern: /\bpln\s*batam\b/i },
  { name: "PLN Energi Primer Indonesia", pattern: /energi\s*primer\s*indonesia\b/i },
  { name: "PLN Energy Management Indonesia", pattern: /energy\s*management\s*indonesia\b|\bemi\b/i },
  { name: "PLN MCTN", pattern: /\bmctn\b/i },
];

export function classifyPlnCompanyGroup(unit: string | null | undefined): string {
  const trimmed = unit?.trim();
  if (!trimmed || trimmed === UNIDENTIFIED_UNIT) return UNIDENTIFIED_UNIT;
  for (const rule of SUBSIDIARY_RULES) {
    if (rule.pattern.test(trimmed)) return rule.name;
  }
  if (/\bpln\b/i.test(trimmed)) return "PLN Pusat";
  return "Lainnya / Eksternal";
}

/**
 * Same basis as calculateUnitDistribution (active + Zoom-valid attendees), grouped
 * coarser. Classifies from the participant's own company field (the raw "Nama
 * Perusahaan" registration column) when available -- unitFinal is a specific
 * office/division (e.g. "UP3 KUALA KAPUAS") and often doesn't contain the company
 * name at all, so guessing the company from it alone misclassifies real PLN staff
 * as "Lainnya / Eksternal". Falls back to unitFinal only for webinars ingested
 * before the company field existed.
 */
export function calculateCompanyGroupDistribution(participants: Participant[]): UnitDistributionRow[] {
  const active = activeParticipants(participants).filter((p) => p.attendance.zoomValidAttendee);
  const counts = new Map<string, number>();
  for (const p of active) {
    const group = classifyPlnCompanyGroup(p.company ?? p.unitFinal);
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([unit, count]) => ({ unit, count }))
    .sort((a, b) => b.count - a.count);
}
