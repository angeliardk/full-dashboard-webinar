import * as XLSX from "xlsx";
import type { ParsedSheetTable, RawWorkbook } from "@/types/import";
import { normalizeHeaderKey } from "./header-normalizer";

/** Reads an .xlsx/.xls file fully in the browser — nothing is uploaded to a server. */
export async function readWorkbookFile(file: File): Promise<RawWorkbook> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true, raw: true });
  const sheets: ParsedSheetTable[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const rows2d: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: false,
    });
    const headerRow = (rows2d[0] ?? []).map((h) => (h == null ? "" : String(h).trim()));
    const rows = rows2d.slice(1).map((r) => {
      const obj: Record<string, unknown> = {};
      headerRow.forEach((h, i) => {
        if (!h) return;
        obj[h] = r[i] ?? null;
      });
      return obj;
    });
    return { name, headers: headerRow.filter(Boolean), rows };
  });
  return { fileName: file.name, sheets };
}

export function findSheet(workbook: RawWorkbook, name: string): ParsedSheetTable | undefined {
  const target = normalizeHeaderKey(name);
  return workbook.sheets.find((s) => normalizeHeaderKey(s.name) === target);
}

/**
 * Detects the main participant sheet by scoring header overlap against a
 * signature, not by sheet name — this is what lets "W3 Detail Skor
 * Feedback" be recognized as the participant sheet.
 */
export function detectParticipantSheet(
  workbook: RawWorkbook,
  signatureHeaders: string[],
): { sheet: ParsedSheetTable; score: number } | null {
  let best: { sheet: ParsedSheetTable; score: number } | null = null;
  const sig = signatureHeaders.map(normalizeHeaderKey);
  for (const sheet of workbook.sheets) {
    const headerSet = new Set(sheet.headers.map(normalizeHeaderKey));
    const matches = sig.filter((h) => headerSet.has(h)).length;
    const score = matches / sig.length;
    if (!best || score > best.score) best = { sheet, score };
  }
  if (!best || best.score < 0.5) return null;
  return best;
}

export function getColumn(headers: string[], candidates: string[]): string | null {
  const normHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeaderKey(h) }));
  for (const candidate of candidates) {
    const target = normalizeHeaderKey(candidate);
    const found = normHeaders.find((h) => h.norm === target);
    if (found) return found.raw;
  }
  return null;
}

export function feedbackColumns(headers: string[]): string[] {
  return headers.filter((h) => normalizeHeaderKey(h).startsWith("feedback -") || normalizeHeaderKey(h).startsWith("feedback-"));
}
