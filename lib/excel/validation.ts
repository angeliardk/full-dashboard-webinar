import type { FeedbackResponse, Participant, ValidationIssue } from "@/types/webinar";
import { REQUIRED_PARTICIPANT_COLUMNS } from "./participant-mapper";
import { normalizeHeaderKey } from "./header-normalizer";

export function validateRequiredColumns(headers: string[]): ValidationIssue[] {
  const headerSet = new Set(headers.map(normalizeHeaderKey));
  const missing = REQUIRED_PARTICIPANT_COLUMNS.filter((c) => !headerSet.has(normalizeHeaderKey(c)));
  if (missing.length === 0) return [];
  return [
    {
      level: "error",
      code: "missing-required-columns",
      message: `Kolom wajib tidak ditemukan: ${missing.join(", ")}`,
      count: missing.length,
    },
  ];
}

export function validateParticipants(
  participants: Participant[],
  duplicatesDiscarded: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (participants.length === 0) {
    issues.push({ level: "error", code: "no-valid-participants", message: "Tidak ada baris peserta valid yang ditemukan." });
  }

  const noIdentity = participants.filter((p) => p.identityKeySource === "name-only");
  if (noIdentity.length > 0) {
    issues.push({
      level: "warning",
      code: "no-identity-key",
      message: `${noIdentity.length} peserta tanpa Email/NIP/Participant Key/Unit yang valid — diidentifikasi hanya dari nama.`,
      count: noIdentity.length,
    });
  }

  if (duplicatesDiscarded > 0) {
    issues.push({
      level: "warning",
      code: "duplicates-found",
      message: `${duplicatesDiscarded} baris duplikat ditemukan dan digabungkan (attempt terbaru dipertahankan).`,
      count: duplicatesDiscarded,
    });
  }

  const outOfRangeScores = participants.filter(
    (p) =>
      (p.learning.preScore != null && (p.learning.preScore < 0 || p.learning.preScore > 100)) ||
      (p.learning.postScore != null && (p.learning.postScore < 0 || p.learning.postScore > 100)),
  );
  if (outOfRangeScores.length > 0) {
    issues.push({
      level: "warning",
      code: "score-out-of-range",
      message: `${outOfRangeScores.length} skor pre/post di luar rentang 0-100.`,
      count: outOfRangeScores.length,
    });
  }

  const junk = participants.filter((p) => p.suspectedTestJunk);
  if (junk.length > 0) {
    issues.push({
      level: "warning",
      code: "suspected-test-junk",
      message: `${junk.length} baris terindikasi data uji coba/junk — tidak dihapus otomatis, mohon ditinjau di mode admin.`,
      count: junk.length,
    });
  }

  const excluded = participants.filter((p) => p.excluded);
  if (excluded.length > 0) {
    issues.push({
      level: "info",
      code: "excluded-rows",
      message: `${excluded.length} baris ditandai Exclude=Ya dan dikeluarkan dari seluruh kalkulasi.`,
      count: excluded.length,
    });
  }

  return issues;
}

export function validateFeedback(feedback: FeedbackResponse[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const outOfRange = feedback.filter(
    (f) => f.type === "likert" && f.valueNumeric != null && (f.valueNumeric < 1 || f.valueNumeric > 5),
  );
  if (outOfRange.length > 0) {
    issues.push({
      level: "warning",
      code: "feedback-out-of-range",
      message: `${outOfRange.length} nilai feedback Likert di luar rentang 1-5.`,
      count: outOfRange.length,
    });
  }
  return issues;
}

export function validateExtraColumns(headers: string[], knownHeaders: string[]): ValidationIssue[] {
  const known = new Set(knownHeaders.map(normalizeHeaderKey));
  const extra = headers.filter((h) => !known.has(normalizeHeaderKey(h)) && !normalizeHeaderKey(h).startsWith("feedback -"));
  if (extra.length === 0) return [];
  return [
    {
      level: "info",
      code: "extra-columns",
      message: `${extra.length} kolom tambahan ditemukan dan diabaikan: ${extra.slice(0, 8).join(", ")}${extra.length > 8 ? ", ..." : ""}`,
      count: extra.length,
    },
  ];
}
