import type { ParsedWorkbookResult } from "@/types/import";
import { readWorkbookFile } from "./workbook-parser";
import { parseCanonicalWorkbook } from "./canonical-template-adapter";
import { looksLikeWebinar3Workbook, parseWebinar3Workbook } from "./webinar3-adapter";

export interface ParseWorkbookOptions {
  attendanceThresholdMinutes?: number;
}

/**
 * Single entry point used by the upload wizard. Picks the Webinar 3 adapter
 * automatically when the file carries its audit sheets — the user never has
 * to rename sheets or columns.
 */
export async function parseWebinarExcelFile(
  file: File,
  opts: ParseWorkbookOptions = {},
): Promise<ParsedWorkbookResult> {
  const workbook = await readWorkbookFile(file);
  if (looksLikeWebinar3Workbook(workbook)) {
    return parseWebinar3Workbook(workbook, opts);
  }
  return parseCanonicalWorkbook(workbook, opts);
}

export { readWorkbookFile } from "./workbook-parser";
