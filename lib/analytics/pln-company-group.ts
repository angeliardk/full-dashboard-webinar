import type { Participant } from "@/types/webinar";
import type { UnitDistributionRow } from "@/types/analytics";
import { activeParticipants, UNIDENTIFIED_UNIT } from "./helpers";

/**
 * Coarse "PLN Pusat vs anak perusahaan/unit tersendiri PLN" grouping, layered
 * on top of the detailed unitFinal string rather than replacing it. None of
 * these are legally separate from PT PLN (Persero) -- Puslitbang (PLN's R&D
 * center) and the four regional Unit Induk categories below are broken out
 * as their own lines purely because that's how the organizer's own reports
 * present them, not because they're subsidiaries. Order matters: "Nusantara
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

// The four PLN "Unit Induk" regional categories -- broken out as their own
// lines (same spirit as Puslitbang/PLN Services above) rather than folded
// into generic "PLN Pusat", matching the naming the organizer's own report
// uses. Checked before the generic PLN_UNIT_CODE_PATTERN below so e.g. "UIP
// JBB" lands here, not in the generic bucket.
const REGIONAL_UNIT_RULES: { name: string; pattern: RegExp }[] = [
  { name: "PLN Unit Induk Pembangkit (UIP)", pattern: /\buip\b/i },
  { name: "PLN Unit Induk Distribusi (UID)", pattern: /\buid\b/i },
  { name: "PLN Unit Induk Transmisi (UIT)", pattern: /\buit\b/i },
  { name: "PLN Unit Induk Wilayah (UIW)", pattern: /\buiw\b/i },
];

// Internal PLN office/division codes that never spell out "PLN" on their own,
// but -- unlike the four regional categories above -- stay folded into the
// generic "PLN Pusat" bucket rather than broken out further: UP2B/UIP2B/
// UIP3B (beban-pengatur/load-dispatch units) and Pusmanpro (Pusat Manajemen
// Proyek) aren't one of the organizer's four report categories. Confirmed
// against this same dataset: the exact same codes (e.g. "UIT JBT", "UIP2B
// JAMALI") appear elsewhere for participants whose company field *was* a
// clean "PLN", so none of this is a guess.
const PLN_UNIT_CODE_PATTERN = /\bup2b\b|\buip2b\b|\buip3b\b|\bpusmanpro\b/i;

// "Distribusi <daerah>" and "Div Retail Reg..." are PLN's own business-unit
// naming (the registration form's "Nama Perusahaan" column only ever asks
// which PLN company a participant is from), and bare "Pusat" / "Kantor
// Pusat" / "Kantor pusat" -- confirmed by the organizer for the specific
// Webinar 6 registrants who used them -- are too generic a phrase to trust
// as a substring, so these are anchored to the whole (trimmed) value rather
// than matched anywhere inside it.
const PLN_GENERIC_DIVISION_PATTERN = /^(kantor\s*)?pusat$/i;
const PLN_BUSINESS_UNIT_PATTERN = /^distribusi\b|\bdiv\s*retail\b/i;

function looksLikePln(s: string): boolean {
  // "PLN" fused directly onto the next word (e.g. "PLNE", "PLNUIP SBT") has
  // no word boundary after it for \bpln\b to catch, hence the separate
  // starts-with check.
  return (
    /\bpln\b/i.test(s) ||
    /^pln/i.test(s) ||
    PLN_UNIT_CODE_PATTERN.test(s) ||
    PLN_GENERIC_DIVISION_PATTERN.test(s) ||
    PLN_BUSINESS_UNIT_PATTERN.test(s)
  );
}

// A handful of exact company values the organizer has looked at and isn't
// confident are genuinely a different, named organization (as opposed to
// yet another messy/abbreviated PLN entry we just haven't matched a pattern
// for) -- routed to "Tidak Teridentifikasi" rather than asserted as external
// on a guess. Keyed by the lowercased, trimmed company string.
const UNCERTAIN_EXTERNAL_OVERRIDES = new Set(["pt mitra karya prima"]);

export function classifyPlnCompanyGroup(unit: string | null | undefined): string {
  const trimmed = unit?.trim();
  if (!trimmed || trimmed === UNIDENTIFIED_UNIT) return UNIDENTIFIED_UNIT;
  for (const rule of SUBSIDIARY_RULES) {
    if (rule.pattern.test(trimmed)) return rule.name;
  }
  for (const rule of REGIONAL_UNIT_RULES) {
    if (rule.pattern.test(trimmed)) return rule.name;
  }
  if (looksLikePln(trimmed)) return "PLN Pusat";
  if (UNCERTAIN_EXTERNAL_OVERRIDES.has(trimmed.toLowerCase())) return UNIDENTIFIED_UNIT;
  // A value with no letters at all ("5", a stray NIP-looking number) isn't
  // evidence of being a genuine external organization -- it's unreadable
  // data, so it belongs with "Tidak Teridentifikasi", not "Lainnya / Eksternal".
  if (!/[a-z]/i.test(trimmed)) return UNIDENTIFIED_UNIT;
  return "Lainnya / Eksternal";
}

// "PLN Pusat" is the generic fallback match (just "PLN" with no further
// specifics) -- a weak signal that a more specific field should be allowed
// to override, unlike a real subsidiary or regional-unit match.
const GENERIC_GROUPS = new Set(["PLN Pusat", "Lainnya / Eksternal", UNIDENTIFIED_UNIT]);

/**
 * Same basis as calculateUnitDistribution (active + Zoom-valid attendees), grouped
 * coarser. Classifies from whichever of company/unitFinal gives the most specific
 * answer -- company (the raw "Nama Perusahaan" registration column) is usually the
 * more reliable field, but it's very often just a bare "PLN" with no further detail,
 * while unitFinal carries the actual regional unit ("UIP JBB", "UID Sulselrabar").
 * Checking company alone and stopping the moment it resolves to generic "PLN Pusat"
 * would throw that detail away, so a generic "PLN Pusat" match from either field is
 * held as a fallback rather than returned immediately -- the loop keeps looking for
 * a specific subsidiary or regional-unit match in the other field first. This is
 * also what catches e.g. a company field that's a stray ID number but a unitFinal
 * of "PLN Pusat".
 */
function classifyParticipantCompany(p: Participant): string {
  const candidates = [p.company, p.unitFinal].filter((f): f is string => !!f && f.trim() !== "");
  let genericFallback: string | null = null;
  for (const field of candidates) {
    const group = classifyPlnCompanyGroup(field);
    if (!GENERIC_GROUPS.has(group)) return group;
    if (group === "PLN Pusat" && genericFallback == null) genericFallback = group;
  }
  if (genericFallback) return genericFallback;
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
