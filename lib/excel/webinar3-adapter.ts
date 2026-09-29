import type { ImportAuditRow, ValidationIssue } from "@/types/webinar";
import type { ParsedWorkbookResult, RawWorkbook } from "@/types/import";
import { findSheet } from "./workbook-parser";
import { parseCanonicalWorkbook } from "./canonical-template-adapter";
import { calculateLearningMetrics } from "@/lib/analytics/learning";
import { cleanString, parseNumber } from "./header-normalizer";

const AUDIT_SHEET_NAMES = ["Ringkasan Merge", "Duplicate Dibuang", "Unmatched PRE", "PRE Dedup", "POST Feedback Dedup", "Ringkasan Unit"];

export function looksLikeWebinar3Workbook(workbook: RawWorkbook): boolean {
  const names = new Set(workbook.sheets.map((s) => s.name));
  return ["Ringkasan Merge", "Duplicate Dibuang", "Unmatched PRE"].some((n) => names.has(n));
}

function sheetToAuditRows(workbook: RawWorkbook, name: string): ImportAuditRow[] {
  const sheet = findSheet(workbook, name);
  if (!sheet) return [];
  return sheet.rows.map((raw) => ({ reason: `Baris dari sheet audit "${name}"`, raw }));
}

function parseRingkasanMerge(workbook: RawWorkbook): Map<string, { value: number | null; note: string | null }> {
  const sheet = findSheet(workbook, "Ringkasan Merge");
  const map = new Map<string, { value: number | null; note: string | null }>();
  if (!sheet) return map;
  const [metricCol, valueCol, noteCol] = sheet.headers;
  for (const row of sheet.rows) {
    const label = cleanString(row[metricCol]);
    if (!label) continue;
    map.set(label.trim().toLowerCase(), {
      value: parseNumber(row[valueCol]),
      note: noteCol ? cleanString(row[noteCol]) : null,
    });
  }
  return map;
}

function closeEnough(a: number, b: number, tolerance = 0.05): boolean {
  return Math.abs(a - b) <= tolerance;
}

/**
 * Wraps the generic canonical parser (which already recognizes the main
 * participant sheet by header signature) and layers on Webinar-3-specific
 * audit-sheet handling: Duplicate Dibuang / Unmatched PRE / PRE Dedup /
 * POST Feedback Dedup / Ringkasan Unit / Ringkasan Merge.
 */
export function parseWebinar3Workbook(
  workbook: RawWorkbook,
  opts: { attendanceThresholdMinutes?: number } = {},
): ParsedWorkbookResult {
  const base = parseCanonicalWorkbook(workbook, opts);

  const duplicatesDiscardedSheet = sheetToAuditRows(workbook, "Duplicate Dibuang");
  const unmatchedPre = sheetToAuditRows(workbook, "Unmatched PRE");
  const preDedupSheet = findSheet(workbook, "PRE Dedup");
  const postDedupSheet = findSheet(workbook, "POST Feedback Dedup");
  const unitSummarySheet = findSheet(workbook, "Ringkasan Unit");
  const ringkasanMerge = parseRingkasanMerge(workbook);

  const summaryIssues: ValidationIssue[] = [];

  if (unmatchedPre.length > 0) {
    summaryIssues.push({
      level: "warning",
      code: "unmatched-pre",
      message: `${unmatchedPre.length} pengisi pre-test tidak match ke sheet peserta gabungan (lihat "Unmatched PRE"). Tidak dipasangkan secara diam-diam.`,
      count: unmatchedPre.length,
    });
  }

  const learning = calculateLearningMetrics(base.participants);
  const uniquePre = ringkasanMerge.get("unique pengisi pre-test");
  if (uniquePre?.value != null && uniquePre.value !== learning.preRespondentCount) {
    const diff = uniquePre.value - learning.preRespondentCount;
    summaryIssues.push({
      level: "info",
      code: "pre-count-basis-difference",
      message: `Sheet "Ringkasan Merge" mencatat ${uniquePre.value} unique pengisi pre-test (termasuk yang tidak match), sedangkan ${learning.preRespondentCount} di antaranya sudah match ke database peserta. Selisih ${diff} berasal dari "Unmatched PRE" — kedua angka ditampilkan terpisah di dashboard, bukan disamakan.`,
    });
  }

  const avgPreAll = ringkasanMerge.get("rata-rata skor pre-test");
  if (avgPreAll?.value != null && learning.preAverage != null && !closeEnough(avgPreAll.value, learning.preAverage, 5)) {
    summaryIssues.push({
      level: "info",
      code: "pre-average-basis-difference",
      message: `Rata-rata pre-test seluruh unique (${avgPreAll.value}) dari "Ringkasan Merge" berbeda dari rata-rata pre-test peserta yang sudah match (${learning.preAverage}) karena basis datanya berbeda (lihat catatan unmatched PRE di atas).`,
    });
  }

  if (unitSummarySheet) {
    summaryIssues.push({
      level: "info",
      code: "unit-summary-cross-check-available",
      message: `Sheet "Ringkasan Unit" (${unitSummarySheet.rows.length} unit) tersedia sebagai cross-check; distribusi unit utama tetap dihitung ulang dari sheet peserta.`,
    });
  }

  return {
    ...base,
    adapter: "webinar3",
    issues: [...base.issues, ...summaryIssues],
    duplicatesDiscarded: [...base.duplicatesDiscarded, ...duplicatesDiscardedSheet],
    duplicateRowCount: base.duplicateRowCount + duplicatesDiscardedSheet.length,
    unmatchedPre,
    preDedupRows: preDedupSheet?.rows ?? [],
    postDedupRows: postDedupSheet?.rows ?? [],
    unitSummaryCrossCheck: unitSummarySheet?.rows ?? [],
    summarySheetComparison: summaryIssues,
  };
}

export { AUDIT_SHEET_NAMES };
