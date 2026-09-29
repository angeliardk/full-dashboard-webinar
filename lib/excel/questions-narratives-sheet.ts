import type { ParsedSheetTable } from "@/types/import";
import type { NarrativeItem, NarrativeType, WebinarNarratives, WebinarQuestion } from "@/types/webinar";
import { emptyNarratives } from "@/types/webinar";
import { cleanString, parseNumber, parseTimestamp } from "./header-normalizer";
import { getColumn } from "./workbook-parser";

let qCounter = 0;
function nextQId(): string {
  qCounter += 1;
  return `q-${qCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseQuestionsSheet(sheet: ParsedSheetTable | undefined): WebinarQuestion[] {
  if (!sheet) return [];
  const timeCol = getColumn(sheet.headers, ["Time", "Waktu"]);
  const askerCol = getColumn(sheet.headers, ["Asker Name", "Nama Penanya", "Penanya"]);
  const unitCol = getColumn(sheet.headers, ["Unit"]);
  const questionCol = getColumn(sheet.headers, ["Question", "Pertanyaan"]);
  if (!questionCol) return [];

  return sheet.rows
    .map((row) => {
      const question = cleanString(row[questionCol]);
      if (!question) return null;
      return {
        id: nextQId(),
        time: timeCol ? parseTimestamp(row[timeCol]) ?? cleanString(row[timeCol]) : null,
        askerName: askerCol ? cleanString(row[askerCol]) : null,
        unit: unitCol ? cleanString(row[unitCol]) : null,
        question,
      } satisfies WebinarQuestion;
    })
    .filter((q): q is WebinarQuestion => q != null);
}

const NARRATIVE_TYPES: NarrativeType[] = ["finding", "strength", "improvement", "recommendation", "limitation"];
const TYPE_ALIASES: Record<string, NarrativeType> = {
  finding: "finding", temuan: "finding",
  strength: "strength", kekuatan: "strength",
  improvement: "improvement", perbaikan: "improvement", "area perbaikan": "improvement",
  recommendation: "recommendation", rekomendasi: "recommendation",
  limitation: "limitation", keterbatasan: "limitation",
};

let nCounter = 0;
function nextNId(): string {
  nCounter += 1;
  return `n-${nCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseNarrativesSheet(sheet: ParsedSheetTable | undefined): WebinarNarratives | null {
  if (!sheet) return null;
  const typeCol = getColumn(sheet.headers, ["Type", "Tipe"]);
  const textCol = getColumn(sheet.headers, ["Text", "Teks"]);
  const orderCol = getColumn(sheet.headers, ["Order", "Urutan"]);
  if (!typeCol || !textCol) return null;

  const out = emptyNarratives();
  sheet.rows.forEach((row, i) => {
    const rawType = cleanString(row[typeCol])?.toLowerCase();
    const text = cleanString(row[textCol]);
    if (!rawType || !text) return;
    const type = TYPE_ALIASES[rawType];
    if (!type || !NARRATIVE_TYPES.includes(type)) return;
    const order = orderCol ? parseNumber(row[orderCol]) ?? i : i;
    const item: NarrativeItem = { id: nextNId(), text, order, edited: false };
    out[type].push(item);
  });
  for (const type of NARRATIVE_TYPES) out[type].sort((a, b) => a.order - b.order);
  return out;
}
