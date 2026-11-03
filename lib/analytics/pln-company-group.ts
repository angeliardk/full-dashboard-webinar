import type { Participant } from "@/types/webinar";
import type { UnitDistributionRow } from "@/types/analytics";
import { activeParticipants, UNIDENTIFIED_UNIT } from "./helpers";

/**
 * Coarse "PLN Pusat vs anak perusahaan/unit tersendiri PLN" grouping, layered
 * on top of the detailed unitFinal string rather than replacing it -- every
 * other specific division/regional office (UIP/UID/UIT/...) still rolls up
 * to "PLN Pusat" here, since legally it's part of PT PLN (Persero) itself,
 * not a separate subsidiary. Puslitbang (PLN's R&D center) is legally part
 * of PLN Pusat too, but is broken out as its own line below by request, since
 * it's commonly thought of as a distinct unit. Order matters: "Nusantara
 * Power Services" must be checked before "Nusantara Power" since the latter
 * is a substring of the former.
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
  { name: "PLN Puslitbang", pattern: /puslitbang\b/i },
  // Newest subholding: PT PLN Electricity Services + PT PLN Nusa Daya merged
  // into "PLN Services" -- registrants may still use either legacy name.
  { name: "PLN Services", pattern: /nusa\s*daya\b|electricity\s*services\b/i },
];

// Internal PLN office/division codes that never spell out "PLN" on their own
// (UIP = Unit Induk Pembangunan, UID = ...Distribusi, UIT = ...Transmisi, UIW
// = ...Wilayah, UP2B/UIP2B/UIP3B = beban-pengatur units, Pusmanpro = Pusat
// Manajemen Proyek) -- confirmed against this same dataset: the exact same
// codes (e.g. "UIT JBT", "UIP2B JAMALI") appear elsewhere for participants
// whose company field *was* a clean "PLN", so this isn't a guess.
const PLN_UNIT_CODE_PATTERN = /\buip\b|\buid\b|\buit\b|\buiw\b|\bup2b\b|\buip2b\b|\buip3b\b|\bpusmanpro\b/i;

function looksLikePln(s: string): boolean {
  // "PLN" fused directly onto the next word (e.g. "PLNE", "PLNUIP SBT") has
  // no word boundary after it for \bpln\b to catch, hence the separate
  // starts-with check.
  return /\bpln\b/i.test(s) || /^pln/i.test(s) || PLN_UNIT_CODE_PATTERN.test(s);
}

export function classifyPlnCompanyGroup(unit: string | null | undefined): string {
  const trimmed = unit?.trim();
  if (!trimmed || trimmed === UNIDENTIFIED_UNIT) return UNIDENTIFIED_UNIT;
  for (const rule of SUBSIDIARY_RULES) {
    if (rule.pattern.test(trimmed)) return rule.name;
  }
  if (looksLikePln(trimmed)) return "PLN Pusat";
  // A value with no letters at all ("5", a stray NIP-looking number) isn't
  // evidence of being a genuine external organization -- it's unreadable
  // data, so it belongs with "Tidak Teridentifikasi", not "Lainnya / Eksternal".
  if (!/[a-z]/i.test(trimmed)) return UNIDENTIFIED_UNIT;
  return "Lainnya / Eksternal";
}

/**
 * Same basis as calculateUnitDistribution (active + Zoom-valid attendees), grouped
 * coarser. Classifies from the participant's own company field (the raw "Nama
 * Perusahaan" registration column) first -- unitFinal is a specific office/
 * division (e.g. "UP3 KUALA KAPUAS") and often doesn't contain the company name
 * at all. When the company field is messy enough that neither it nor the
 * SUBSIDIARY_RULES/looksLikePln checks can place it, unitFinal gets a second
 * try before we conclude the person is a genuine external participant (see
 * classifyParticipantCompany) -- this is what catches e.g. a company field
 * that's a stray ID number but a unitFinal of "PLN Pusat".
 */
function classifyParticipantCompany(p: Participant): string {
  const candidates = [p.company, p.unitFinal].filter((f): f is string => !!f && f.trim() !== "");
  for (const field of candidates) {
    const group = classifyPlnCompanyGroup(field);
    if (group !== "Lainnya / Eksternal" && group !== UNIDENTIFIED_UNIT) return group;
  }
  return classifyPlnCompanyGroup(p.company ?? p.unitFinal);
}

export function calculateCompanyGroupDistribution(participants: Participant[]): UnitDistributionRow[] {
  const active = activeParticipants(participants).filter((p) => p.attendance.zoomValidAttendee);
  const counts = new Map<string, number>();
  for (const p of active) {
    const group = classifyParticipantCompany(p);
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([unit, count]) => ({ unit, count }))
    .sort((a, b) => b.count - a.count);
}
