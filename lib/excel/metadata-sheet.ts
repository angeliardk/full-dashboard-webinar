import type { ParsedSheetTable } from "@/types/import";
import type { WebinarMetadata } from "@/types/webinar";
import { cleanString, parseNumber } from "./header-normalizer";

const KEY_ALIASES: Record<string, keyof WebinarMetadata> = {
  webinar_id: "id",
  id: "id",
  webinar_number: "number",
  number: "number",
  title: "title",
  judul: "title",
  subtitle: "subtitle",
  subjudul: "subtitle",
  date: "date",
  tanggal: "date",
  theme: "theme",
  tema: "theme",
  speaker: "speaker",
  narasumber: "speaker",
  series_name: "seriesName",
  source_name: "sourceName",
  population: "population",
  populasi: "population",
  attendance_threshold_minutes: "attendanceThresholdMinutes",
};

/** Parses a two-column (key, value) Metadata sheet into a partial WebinarMetadata. */
export function parseMetadataSheet(sheet: ParsedSheetTable | undefined): Partial<WebinarMetadata> {
  if (!sheet) return {};
  const keyHeader = sheet.headers[0];
  const valueHeader = sheet.headers[1];
  if (!keyHeader || !valueHeader) return {};

  const out: Partial<WebinarMetadata> = {};
  for (const row of sheet.rows) {
    const rawKey = cleanString(row[keyHeader]);
    if (!rawKey) continue;
    const normKey = rawKey.trim().toLowerCase().replace(/\s+/g, "_");
    const field = KEY_ALIASES[normKey];
    if (!field) continue;
    const rawValue = row[valueHeader];
    if (field === "number" || field === "population" || field === "attendanceThresholdMinutes") {
      const n = parseNumber(rawValue);
      if (n != null) (out as Record<string, unknown>)[field] = n;
    } else {
      const s = cleanString(rawValue);
      if (s != null) (out as Record<string, unknown>)[field] = s;
    }
  }
  return out;
}
