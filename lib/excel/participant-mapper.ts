import type { Participant } from "@/types/webinar";
import {
  cleanString,
  isValidEmail,
  isValidNip,
  normalizeEmail,
  normalizeUnit,
  parseBoolean,
  parseIdentifierString,
  parseNumber,
  parseTimestamp,
} from "./header-normalizer";
import { getColumn } from "./workbook-parser";

export const REQUIRED_PARTICIPANT_COLUMNS = [
  "Nama",
  "Unit Kerja Final",
  "Registrasi ECADIN?",
  "Hadir Zoom >30m?",
  "Durasi Zoom Total (menit)",
  "Isi Pre-Test?",
  "Skor Pre Final",
  "Isi Post-Test?",
  "Skor Post Final",
  "Isi Feedback?",
] as const;

export const OPTIONAL_DEMOGRAPHIC_COLUMNS = ["Jenis Kelamin", "Usia", "Pendidikan", "Jabatan"] as const;

const ALIASES = {
  participantKey: ["Participant Key", "Merge Key", "Key Matching"],
  name: ["Nama"],
  email: ["Email"],
  nip: ["NIP"],
  phone: ["Nomor HP"],
  unitFinal: ["Unit Kerja Final"],
  gender: ["Jenis Kelamin"],
  age: ["Usia"],
  education: ["Pendidikan"],
  position: ["Jabatan"],
  identificationCategory: ["Kategori Identifikasi"],
  unitSource: ["Unit Source"],
  registeredEcadin: ["Registrasi ECADIN?"],
  attendedZoomForm: ["Absensi Saat Zoom?"],
  inZoomCsv: ["Ada di Zoom CSV?"],
  zoomValidAttendee: ["Hadir Zoom >30m?"],
  zoomDurationMinutes: ["Durasi Zoom Total (menit)"],
  zoomJoinCount: ["Jumlah Join Zoom"],
  zoomDisplayName: ["Nama Zoom Asli"],
  tookPre: ["Isi Pre-Test?"],
  preTimestamp: ["Pre Timestamp"],
  preCorrect: ["Pre Benar"],
  preWrong: ["Pre Salah"],
  preScore: ["Skor Pre Final"],
  preAnswers: ["Pre Answers"],
  tookPost: ["Isi Post-Test?"],
  postTimestamp: ["Post Timestamp"],
  postCorrect: ["Post Benar"],
  postWrong: ["Post Salah"],
  postScore: ["Skor Post Final"],
  postAnswers: ["Post Answers"],
  scoreDelta: ["Selisih Skor Final"],
  scoreChangeStatus: ["Status Perubahan Skor"],
  hasPrePost: ["Punya Pre & Post?"],
  feedbackSubmitted: ["Isi Feedback?"],
  statusPengisian: ["Status Pengisian"],
  dataSource: ["Sumber Data"],
  notes: ["Catatan"],
  excludeFlag: ["Exclude?"],
  exclusionReason: ["Exclusion Reason"],
} as const;

export function resolveParticipantColumns(headers: string[]) {
  const resolved: Partial<Record<keyof typeof ALIASES, string | null>> = {};
  for (const key of Object.keys(ALIASES) as (keyof typeof ALIASES)[]) {
    resolved[key] = getColumn(headers, [...ALIASES[key]]);
  }
  return resolved as Record<keyof typeof ALIASES, string | null>;
}

export interface IdentityResult {
  key: string;
  source: Participant["identityKeySource"];
  warning: boolean;
}

export function computeIdentityKey(fields: {
  email: string | null;
  nip: string | null;
  participantKey: string | null;
  name: string | null;
  unit: string | null;
}): IdentityResult {
  if (isValidEmail(fields.email)) return { key: `email:${fields.email}`, source: "email", warning: false };
  if (isValidNip(fields.nip)) return { key: `nip:${fields.nip.toLowerCase()}`, source: "nip", warning: false };
  if (fields.participantKey) {
    return { key: `pk:${fields.participantKey.trim().toLowerCase()}`, source: "participant-key", warning: false };
  }
  if (fields.name && fields.unit) {
    return {
      key: `nu:${fields.name.trim().toLowerCase()}|${fields.unit.trim().toLowerCase()}`,
      source: "name-unit",
      warning: false,
    };
  }
  return { key: `n:${(fields.name ?? "unknown").trim().toLowerCase()}`, source: "name-only", warning: true };
}

const JUNK_NAME_PATTERNS = [/^test/i, /^asdf/i, /^qwerty/i, /^\d+$/, /^x+$/i, /^coba/i, /^percobaan/i];

export function detectSuspectedJunk(name: string | null): string | null {
  if (!name) return "Nama kosong";
  if (name.trim().length <= 1) return "Nama terlalu pendek";
  if (JUNK_NAME_PATTERNS.some((re) => re.test(name.trim()))) return "Pola nama menyerupai data uji coba";
  return null;
}

export interface RawParticipantRow {
  raw: Record<string, unknown>;
  participant: Participant;
  identity: IdentityResult;
  sortTimestamp: string | null;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function mapRowToParticipant(
  row: Record<string, unknown>,
  columns: Record<keyof typeof ALIASES, string | null>,
  thresholdMinutes: number,
): RawParticipantRow {
  const get = (key: keyof typeof ALIASES) => (columns[key] ? row[columns[key] as string] : null);

  const name = cleanString(get("name"));
  const email = normalizeEmail(get("email"));
  const nip = parseIdentifierString(get("nip"));
  const phone = parseIdentifierString(get("phone"));
  const unitFinal = normalizeUnit(get("unitFinal"));
  const participantKeyRaw = cleanString(get("participantKey"));

  const identity = computeIdentityKey({ email, nip, participantKey: participantKeyRaw, name, unit: unitFinal });

  const durationMinutes = parseNumber(get("zoomDurationMinutes"));
  const explicitValidFlag = parseBoolean(get("zoomValidAttendee"));
  const zoomValidAttendee =
    explicitValidFlag != null ? explicitValidFlag : durationMinutes != null ? durationMinutes >= thresholdMinutes : false;

  const preScore = parseNumber(get("preScore"));
  const postScore = parseNumber(get("postScore"));
  const explicitHasPrePost = parseBoolean(get("hasPrePost"));
  const tookPre = parseBoolean(get("tookPre")) ?? preScore != null;
  const tookPost = parseBoolean(get("tookPost")) ?? postScore != null;
  const hasPrePost = explicitHasPrePost != null ? explicitHasPrePost : tookPre && tookPost && preScore != null && postScore != null;

  const preTimestamp = parseTimestamp(get("preTimestamp"));
  const postTimestamp = parseTimestamp(get("postTimestamp"));

  const junkReason = detectSuspectedJunk(name);

  const participant: Participant = {
    id: nextId("p"),
    identityKey: identity.key,
    identityKeySource: identity.source,
    name: name ?? "(Tanpa nama)",
    email,
    nip,
    phone,
    unitFinal,
    unitSource: cleanString(get("unitSource")),
    identificationCategory: cleanString(get("identificationCategory")),
    gender: cleanString(get("gender")),
    age: parseNumber(get("age")),
    education: cleanString(get("education")),
    position: cleanString(get("position")),
    attendance: {
      registeredEcadin: parseBoolean(get("registeredEcadin")) ?? false,
      attendedZoomForm: parseBoolean(get("attendedZoomForm")) ?? false,
      inZoomCsv: parseBoolean(get("inZoomCsv")) ?? false,
      zoomValidAttendee,
      zoomDurationMinutes: durationMinutes,
      zoomJoinCount: parseNumber(get("zoomJoinCount")),
      zoomDisplayName: cleanString(get("zoomDisplayName")),
    },
    learning: {
      tookPre,
      preTimestamp,
      preCorrect: parseNumber(get("preCorrect")),
      preWrong: parseNumber(get("preWrong")),
      preScore,
      preAnswers: cleanString(get("preAnswers")),
      tookPost,
      postTimestamp,
      postCorrect: parseNumber(get("postCorrect")),
      postWrong: parseNumber(get("postWrong")),
      postScore,
      postAnswers: cleanString(get("postAnswers")),
      scoreDelta: parseNumber(get("scoreDelta")) ?? (preScore != null && postScore != null ? postScore - preScore : null),
      scoreChangeStatus: cleanString(get("scoreChangeStatus")),
      hasPrePost,
    },
    feedbackSubmitted: parseBoolean(get("feedbackSubmitted")) ?? false,
    statusPengisian: cleanString(get("statusPengisian")),
    dataSource: cleanString(get("dataSource")),
    notes: cleanString(get("notes")),
    excluded: parseBoolean(get("excludeFlag")) ?? false,
    exclusionReason: cleanString(get("exclusionReason")),
    suspectedTestJunk: junkReason != null,
    suspectedTestJunkReason: junkReason,
  };

  return {
    raw: row,
    participant,
    identity,
    sortTimestamp: postTimestamp ?? preTimestamp,
  };
}
