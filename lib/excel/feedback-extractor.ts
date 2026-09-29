import type { FeedbackResponse, FeedbackQuestionType } from "@/types/webinar";
import { categorizeComment } from "@/lib/analytics/feedback";
import { cleanString, isEmptyish } from "./header-normalizer";

function stripFeedbackPrefix(header: string): string {
  return header.replace(/^feedback\s*-\s*/i, "").trim();
}

function classifyColumn(rows: Record<string, unknown>[], column: string): FeedbackQuestionType {
  const values = rows.map((r) => r[column]).filter((v) => !isEmptyish(v));
  if (values.length === 0) return "text";
  let numericInRange = 0;
  for (const v of values) {
    const n = typeof v === "number" ? v : Number(String(v).trim());
    if (!Number.isNaN(n) && n >= 1 && n <= 5 && Number.isInteger(n)) numericInRange++;
  }
  return numericInRange / values.length >= 0.5 ? "likert" : "text";
}

let fbCounter = 0;
function nextFbId(): string {
  fbCounter += 1;
  return `fb-${fbCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Reads every "Feedback - <question>" wide column from the sheet, regardless
 * of how many there are or what they're called, and produces one
 * FeedbackResponse per (row, question) pair.
 */
export function extractFeedbackResponses(
  rows: Record<string, unknown>[],
  feedbackColumns: string[],
  participantIds: string[],
): FeedbackResponse[] {
  const responses: FeedbackResponse[] = [];
  const columnTypes = new Map(feedbackColumns.map((c) => [c, classifyColumn(rows, c)]));

  rows.forEach((row, i) => {
    const participantId = participantIds[i] ?? null;
    for (const column of feedbackColumns) {
      const value = row[column];
      if (isEmptyish(value)) continue;
      const type = columnTypes.get(column) ?? "text";
      const question = stripFeedbackPrefix(column);
      if (type === "likert") {
        const n = typeof value === "number" ? value : Number(String(value).trim());
        if (Number.isNaN(n)) continue;
        responses.push({
          id: nextFbId(),
          participantId,
          question,
          type: "likert",
          valueNumeric: n,
          valueText: null,
          category: null,
          categoryEdited: false,
        });
      } else {
        const text = cleanString(value);
        if (!text) continue;
        responses.push({
          id: nextFbId(),
          participantId,
          question,
          type: "text",
          valueNumeric: null,
          valueText: text,
          category: categorizeComment(text),
          categoryEdited: false,
        });
      }
    }
  });

  return responses;
}
