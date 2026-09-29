import type { ParsedWorkbookResult } from "@/types/import";
import type { ValidationIssue, Webinar, WebinarNarratives } from "@/types/webinar";
import { emptyNarratives } from "@/types/webinar";
import type { WizardMetadataForm } from "@/types/import";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import { generateDefaultNarratives } from "@/lib/narratives/default-narratives";

export function suggestNextWebinarNumber(existing: Webinar[]): number {
  if (existing.length === 0) return 1;
  return Math.max(...existing.map((w) => w.number)) + 1;
}

export function defaultMetadataForm(existing: Webinar[]): WizardMetadataForm {
  const number = suggestNextWebinarNumber(existing);
  return {
    id: `w${number}`,
    number,
    title: "",
    subtitle: "",
    theme: "",
    date: "",
    speaker: "",
    seriesName: existing[0]?.metadata.seriesName ?? "",
    sourceName: "",
    population: existing[0]?.metadata.population ? String(existing[0].metadata.population) : "",
    attendanceThresholdMinutes: "30",
  };
}

export function formFromWebinar(webinar: Webinar): WizardMetadataForm {
  const m = webinar.metadata;
  return {
    id: m.id,
    number: m.number,
    title: m.title,
    subtitle: m.subtitle,
    theme: m.theme,
    date: m.date,
    speaker: m.speaker,
    seriesName: m.seriesName,
    sourceName: m.sourceName,
    population: m.population != null ? String(m.population) : "",
    attendanceThresholdMinutes: String(m.attendanceThresholdMinutes ?? 30),
  };
}

export function mergeParsedMetadataIntoForm(form: WizardMetadataForm, parsed: ParsedWorkbookResult): WizardMetadataForm {
  const m = parsed.metadata;
  return {
    ...form,
    id: m.id ?? form.id,
    number: m.number ?? form.number,
    title: m.title ?? form.title,
    subtitle: m.subtitle ?? form.subtitle,
    theme: m.theme ?? form.theme,
    date: m.date ?? form.date,
    speaker: m.speaker ?? form.speaker,
    seriesName: m.seriesName ?? form.seriesName,
    sourceName: m.sourceName ?? parsed.sheetNames.join(", ") ?? form.sourceName,
    population: m.population != null ? String(m.population) : form.population,
    attendanceThresholdMinutes: m.attendanceThresholdMinutes != null ? String(m.attendanceThresholdMinutes) : form.attendanceThresholdMinutes,
  };
}

export function validateMetadataForm(form: WizardMetadataForm): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!form.id.trim()) issues.push({ level: "error", code: "metadata-id-required", message: "ID webinar wajib diisi." });
  if (!form.number || Number.isNaN(Number(form.number)) || Number(form.number) <= 0) {
    issues.push({ level: "error", code: "metadata-number-required", message: "Nomor webinar wajib diisi dan harus lebih dari 0." });
  }
  if (!form.title.trim()) issues.push({ level: "error", code: "metadata-title-required", message: "Judul webinar wajib diisi." });
  if (!form.date.trim()) issues.push({ level: "error", code: "metadata-date-required", message: "Tanggal webinar wajib diisi." });
  return issues;
}

export function buildWebinarFromParsed(parsed: ParsedWorkbookResult, form: WizardMetadataForm, fileName: string): Webinar {
  const webinarWithoutNarratives: Webinar = {
    id: form.id.trim(),
    number: Number(form.number),
    metadata: {
      id: form.id.trim(),
      number: Number(form.number),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      theme: form.theme.trim(),
      date: form.date.trim(),
      speaker: form.speaker.trim(),
      seriesName: form.seriesName.trim(),
      sourceName: form.sourceName.trim() || fileName,
      population: form.population ? Number(form.population) : null,
      attendanceThresholdMinutes: form.attendanceThresholdMinutes ? Number(form.attendanceThresholdMinutes) : 30,
    },
    participants: parsed.participants,
    feedback: parsed.feedback,
    questions: parsed.questions,
    narratives: emptyNarratives(),
    importInfo: {
      sourceFileName: fileName,
      sourceSheetNames: parsed.sheetNames,
      importedAt: new Date().toISOString(),
      adapter: parsed.adapter,
      rawRowCount: parsed.rawRowCount,
      validRowCount: parsed.validRowCount,
      duplicateRowCount: parsed.duplicateRowCount,
      issues: parsed.issues,
      duplicatesDiscarded: parsed.duplicatesDiscarded,
      unmatchedPre: parsed.unmatchedPre,
      unmatchedPost: parsed.unmatchedPost,
      preDedupRows: parsed.preDedupRows,
      postDedupRows: parsed.postDedupRows,
      unitSummaryCrossCheck: parsed.unitSummaryCrossCheck,
      reconstructed: false,
    },
  };

  // No Narratives sheet? Build a deterministic starting summary from the
  // computed metrics instead of leaving it empty — admin can still edit it.
  const narratives: WebinarNarratives = parsed.narratives
    ? { ...emptyNarratives(), ...parsed.narratives }
    : generateDefaultNarratives(webinarWithoutNarratives, calculateWebinarMetrics(webinarWithoutNarratives));

  return { ...webinarWithoutNarratives, narratives };
}

export interface ReplaceDiff {
  oldParticipantCount: number;
  newParticipantCount: number;
  oldPreAverage: number | null;
  newPreAverage: number | null;
  oldPostAverage: number | null;
  newPostAverage: number | null;
  oldFeedbackCount: number;
  newFeedbackCount: number;
}

export function computeReplaceDiff(oldWebinar: Webinar, newWebinar: Webinar): ReplaceDiff {
  const oldMetrics = calculateWebinarMetrics(oldWebinar);
  const newMetrics = calculateWebinarMetrics(newWebinar);
  return {
    oldParticipantCount: oldMetrics.attendance.databaseParticipantCount,
    newParticipantCount: newMetrics.attendance.databaseParticipantCount,
    oldPreAverage: oldMetrics.learning.preAverage,
    newPreAverage: newMetrics.learning.preAverage,
    oldPostAverage: oldMetrics.learning.postAverage,
    newPostAverage: newMetrics.learning.postAverage,
    oldFeedbackCount: oldMetrics.feedback.distinctRespondentCount,
    newFeedbackCount: newMetrics.feedback.distinctRespondentCount,
  };
}
