import type { WebinarMetrics } from "@/types/analytics";

/**
 * Generic manual-override layer sitting on top of the computed WebinarMetrics.
 * The admin can type in a replacement number for any KPI listed in KPI_FIELDS,
 * for any webinar (1, 2, 3, or any future upload) — no source-code change needed
 * per webinar. Computed values remain available (as the input placeholder) so an
 * override is always a deliberate, visible correction rather than silently lost data.
 */
export interface KpiFieldDef {
  key: string;
  label: string;
  group: string;
  get: (m: WebinarMetrics) => number | null;
  set: (m: WebinarMetrics, value: number) => void;
  suffix?: string;
}

export const KPI_FIELDS: KpiFieldDef[] = [
  { key: "attendance.databaseParticipantCount", label: "Peserta Database", group: "Kehadiran", get: (m) => m.attendance.databaseParticipantCount, set: (m, v) => { m.attendance.databaseParticipantCount = v; } },
  { key: "attendance.registeredCount", label: "Registrasi", group: "Kehadiran", get: (m) => m.attendance.registeredCount, set: (m, v) => { m.attendance.registeredCount = v; } },
  { key: "attendance.zoomValidAttendeeCount", label: "Hadir Zoom Valid", group: "Kehadiran", get: (m) => m.attendance.zoomValidAttendeeCount, set: (m, v) => { m.attendance.zoomValidAttendeeCount = v; } },
  { key: "attendance.registeredAndAttendedCount", label: "Registrasi & Hadir", group: "Kehadiran", get: (m) => m.attendance.registeredAndAttendedCount, set: (m, v) => { m.attendance.registeredAndAttendedCount = v; } },
  { key: "attendance.attendedWithoutRegistrationCount", label: "Hadir Tanpa Registrasi", group: "Kehadiran", get: (m) => m.attendance.attendedWithoutRegistrationCount, set: (m, v) => { m.attendance.attendedWithoutRegistrationCount = v; } },
  { key: "attendance.registeredNotAttendedCount", label: "Registrasi Tidak Hadir", group: "Kehadiran", get: (m) => m.attendance.registeredNotAttendedCount, set: (m, v) => { m.attendance.registeredNotAttendedCount = v; } },
  { key: "attendance.unidentifiedUnitCount", label: "Unit Tidak Teridentifikasi", group: "Kehadiran", get: (m) => m.attendance.unidentifiedUnitCount, set: (m, v) => { m.attendance.unidentifiedUnitCount = v; } },
  { key: "attendance.belowThresholdZoomCount", label: "Hadir Zoom di Bawah Threshold", group: "Kehadiran", get: (m) => m.attendance.belowThresholdZoomCount, set: (m, v) => { m.attendance.belowThresholdZoomCount = v; } },

  { key: "learning.preRespondentCount", label: "Jumlah Pre-Test", group: "Pembelajaran", get: (m) => m.learning.preRespondentCount, set: (m, v) => { m.learning.preRespondentCount = v; } },
  { key: "learning.postRespondentCount", label: "Jumlah Post-Test", group: "Pembelajaran", get: (m) => m.learning.postRespondentCount, set: (m, v) => { m.learning.postRespondentCount = v; } },
  { key: "learning.pairedCount", label: "Pasangan Pre-Post", group: "Pembelajaran", get: (m) => m.learning.pairedCount, set: (m, v) => { m.learning.pairedCount = v; } },
  { key: "learning.preAverage", label: "Rata-rata Pre-Test", group: "Pembelajaran", get: (m) => m.learning.preAverage, set: (m, v) => { m.learning.preAverage = v; } },
  { key: "learning.postAverage", label: "Rata-rata Post-Test", group: "Pembelajaran", get: (m) => m.learning.postAverage, set: (m, v) => { m.learning.postAverage = v; } },
  { key: "learning.pairedGainAverage", label: "Rata-rata Kenaikan", group: "Pembelajaran", get: (m) => m.learning.pairedGainAverage, set: (m, v) => { m.learning.pairedGainAverage = v; } },
  { key: "learning.pairedPreAverage", label: "Rata-rata Pre (Berpasangan)", group: "Pembelajaran", get: (m) => m.learning.pairedPreAverage, set: (m, v) => { m.learning.pairedPreAverage = v; } },
  { key: "learning.pairedPostAverage", label: "Rata-rata Post (Berpasangan)", group: "Pembelajaran", get: (m) => m.learning.pairedPostAverage, set: (m, v) => { m.learning.pairedPostAverage = v; } },
  { key: "learning.improvedCount", label: "Meningkat", group: "Pembelajaran", get: (m) => m.learning.improvedCount, set: (m, v) => { m.learning.improvedCount = v; } },
  { key: "learning.sameCount", label: "Tetap", group: "Pembelajaran", get: (m) => m.learning.sameCount, set: (m, v) => { m.learning.sameCount = v; } },
  { key: "learning.declinedCount", label: "Menurun", group: "Pembelajaran", get: (m) => m.learning.declinedCount, set: (m, v) => { m.learning.declinedCount = v; } },
  { key: "learning.prePerfectCount", label: "Skor Sempurna Pre", group: "Pembelajaran", get: (m) => m.learning.prePerfectCount, set: (m, v) => { m.learning.prePerfectCount = v; } },
  { key: "learning.postPerfectCount", label: "Skor Sempurna Post", group: "Pembelajaran", get: (m) => m.learning.postPerfectCount, set: (m, v) => { m.learning.postPerfectCount = v; } },
  { key: "learning.bothPerfectCount", label: "Skor Sempurna Keduanya", group: "Pembelajaran", get: (m) => m.learning.bothPerfectCount, set: (m, v) => { m.learning.bothPerfectCount = v; } },

  { key: "feedback.responseCount", label: "Jumlah Respons Feedback", group: "Feedback", get: (m) => m.feedback.responseCount, set: (m, v) => { m.feedback.responseCount = v; } },
  { key: "feedback.distinctRespondentCount", label: "Responden Feedback (Unik)", group: "Feedback", get: (m) => m.feedback.distinctRespondentCount, set: (m, v) => { m.feedback.distinctRespondentCount = v; } },

  { key: "completion.preRate", label: "Completion Rate Pre", group: "Completion Rate", suffix: "%", get: (m) => m.completion.preRate, set: (m, v) => { m.completion.preRate = v; } },
  { key: "completion.postRate", label: "Completion Rate Post", group: "Completion Rate", suffix: "%", get: (m) => m.completion.postRate, set: (m, v) => { m.completion.postRate = v; } },
  { key: "completion.feedbackRate", label: "Completion Rate Feedback", group: "Completion Rate", suffix: "%", get: (m) => m.completion.feedbackRate, set: (m, v) => { m.completion.feedbackRate = v; } },
];

export const KPI_FIELD_GROUPS: string[] = Array.from(new Set(KPI_FIELDS.map((f) => f.group)));

export function applyKpiOverrides(
  metrics: WebinarMetrics,
  overrides: Record<string, number> | null | undefined,
): { metrics: WebinarMetrics; overriddenKeys: Set<string> } {
  const overriddenKeys = new Set<string>();
  if (!overrides || Object.keys(overrides).length === 0) {
    return { metrics, overriddenKeys };
  }
  const draft: WebinarMetrics = {
    ...metrics,
    attendance: { ...metrics.attendance },
    learning: { ...metrics.learning },
    feedback: { ...metrics.feedback },
    completion: { ...metrics.completion },
  };
  for (const field of KPI_FIELDS) {
    const value = overrides[field.key];
    if (typeof value !== "number" || Number.isNaN(value)) continue;
    field.set(draft, value);
    overriddenKeys.add(field.key);
  }
  return { metrics: draft, overriddenKeys };
}
