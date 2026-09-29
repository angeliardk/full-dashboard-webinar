import type { DashboardStore, Webinar } from "@/types/webinar";
import { SCHEMA_VERSION } from "@/types/webinar";
import type { WebinarWithMetrics } from "@/lib/analytics/cross-webinar";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Full raw export, including participant PII (name/email/NIP/phone). The
 * caller (admin UI) is responsible for showing a confirmation warning
 * before invoking this — see WebinarEditor / DataQualitySection.
 */
export function exportDashboardJson(webinars: Webinar[], filename = "dashboard-webinar-export.json") {
  const payload: DashboardStore & { exportedAt: string } = {
    schemaVersion: SCHEMA_VERSION,
    webinars,
    settings: { selectedWebinarId: null, selectedTab: "overview", editMode: false },
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  download(blob, filename);
}

export interface ImportJsonResult {
  webinars: Webinar[];
  schemaVersion: number;
}

export async function importDashboardJson(file: File): Promise<ImportJsonResult> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.webinars)) {
    throw new Error("File JSON tidak valid: struktur 'webinars' tidak ditemukan.");
  }
  return { webinars: parsed.webinars as Webinar[], schemaVersion: parsed.schemaVersion ?? 1 };
}

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Aggregate-only CSV (no participant-level PII) for cross-webinar reporting. */
export function exportAggregateCsv(entries: WebinarWithMetrics[], filename = "ringkasan-dashboard-webinar.csv") {
  const header = [
    "Webinar", "Judul", "Peserta DB", "Registrasi", "Hadir Zoom Valid", "Pre-Test", "Post-Test",
    "Pasangan Pre-Post", "Rata-rata Pre", "Rata-rata Post", "Rata-rata Kenaikan", "Feedback",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const { webinar: w, metrics: m } of [...entries].sort((a, b) => a.webinar.number - b.webinar.number)) {
    lines.push(
      [
        `Webinar #${w.number}`, w.metadata.title, m.attendance.databaseParticipantCount, m.attendance.registeredCount,
        m.attendance.zoomValidAttendeeCount, m.learning.preRespondentCount, m.learning.postRespondentCount,
        m.learning.pairedCount, m.learning.preAverage ?? "", m.learning.postAverage ?? "",
        m.learning.pairedGainAverage ?? "", m.feedback.distinctRespondentCount,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  download(blob, filename);
}
