import type { ParsedWorkbookResult, RawWorkbook } from "@/types/import";
import { detectParticipantSheet, feedbackColumns as findFeedbackColumns, findSheet } from "./workbook-parser";
import { REQUIRED_PARTICIPANT_COLUMNS, mapRowToParticipant, resolveParticipantColumns } from "./participant-mapper";
import { dedupeParticipants } from "./dedup";
import { extractFeedbackResponses } from "./feedback-extractor";
import { parseMetadataSheet } from "./metadata-sheet";
import { parseNarrativesSheet, parseQuestionsSheet } from "./questions-narratives-sheet";
import { validateExtraColumns, validateFeedback, validateParticipants, validateRequiredColumns } from "./validation";

const DEFAULT_THRESHOLD_MINUTES = 30;

/**
 * Generic adapter for the official template workbook (Metadata / Participants /
 * Questions / Narratives). The participant sheet is located by header
 * signature rather than by name, so this same code path also recognizes the
 * Webinar 3 file's "W3 Detail Skor Feedback" sheet — see webinar3-adapter.ts
 * for the additional audit-sheet handling layered on top of this.
 */
export function parseCanonicalWorkbook(
  workbook: RawWorkbook,
  opts: { attendanceThresholdMinutes?: number } = {},
): ParsedWorkbookResult {
  const thresholdMinutes = opts.attendanceThresholdMinutes ?? DEFAULT_THRESHOLD_MINUTES;
  const sheetNames = workbook.sheets.map((s) => s.name);

  const metadataSheet = findSheet(workbook, "Metadata");
  const metadata = parseMetadataSheet(metadataSheet);

  const detected = detectParticipantSheet(workbook, [...REQUIRED_PARTICIPANT_COLUMNS]);
  if (!detected) {
    return {
      adapter: "canonical-template",
      sheetNames,
      metadata,
      participants: [],
      feedback: [],
      questions: [],
      narratives: null,
      issues: [
        {
          level: "error",
          code: "no-participant-sheet",
          message: "Tidak ditemukan sheet peserta yang cocok dengan format template (kolom wajib tidak lengkap di sheet manapun).",
        },
      ],
      rawRowCount: 0,
      validRowCount: 0,
      duplicateRowCount: 0,
      duplicatesDiscarded: [],
      unmatchedPre: [],
      unmatchedPost: [],
      preDedupRows: [],
      postDedupRows: [],
      unitSummaryCrossCheck: [],
      summarySheetComparison: [],
    };
  }

  const mainSheet = detected.sheet;
  const columns = resolveParticipantColumns(mainSheet.headers);
  const columnIssues = validateRequiredColumns(mainSheet.headers);

  const candidates = mainSheet.rows.map((row) => mapRowToParticipant(row, columns, thresholdMinutes));
  const { participants, duplicatesDiscarded } = dedupeParticipants(candidates);

  const idByRowOrder = new Map<Record<string, unknown>, string>();
  for (const c of candidates) idByRowOrder.set(c.raw, c.participant.id);
  const keptIds = new Set(participants.map((p) => p.id));
  const participantIdsForFeedback = mainSheet.rows.map((row) => {
    const id = idByRowOrder.get(row) ?? null;
    return id && keptIds.has(id) ? id : null;
  }) as string[];

  const fbColumns = findFeedbackColumns(mainSheet.headers);
  const feedback = extractFeedbackResponses(mainSheet.rows, fbColumns, participantIdsForFeedback).filter(
    (f) => f.participantId == null || keptIds.has(f.participantId),
  );

  const questions = parseQuestionsSheet(findSheet(workbook, "Questions"));
  const narratives = parseNarrativesSheet(findSheet(workbook, "Narratives"));

  const issues = [
    ...columnIssues,
    ...validateParticipants(participants, duplicatesDiscarded.length),
    ...validateFeedback(feedback),
    ...validateExtraColumns(mainSheet.headers, [...REQUIRED_PARTICIPANT_COLUMNS]),
    {
      level: "info" as const,
      code: "sheets-found",
      message: `Sheet ditemukan: ${sheetNames.join(", ")}. Sheet peserta terdeteksi: "${mainSheet.name}" (${Math.round(detected.score * 100)}% kolom cocok).`,
    },
    {
      level: "info" as const,
      code: "row-counts",
      message: `${mainSheet.rows.length} baris dibaca, ${participants.length} peserta valid setelah dedup.`,
    },
  ];

  return {
    adapter: "canonical-template",
    sheetNames,
    metadata,
    participants,
    feedback,
    questions,
    narratives,
    issues,
    rawRowCount: mainSheet.rows.length,
    validRowCount: participants.length,
    duplicateRowCount: duplicatesDiscarded.length,
    duplicatesDiscarded,
    unmatchedPre: [],
    unmatchedPost: [],
    preDedupRows: [],
    postDedupRows: [],
    unitSummaryCrossCheck: [],
    summarySheetComparison: [],
  };
}
