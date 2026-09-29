import type {
  FeedbackResponse,
  ImportAuditRow,
  Participant,
  ValidationIssue,
  WebinarMetadata,
  WebinarNarratives,
  WebinarQuestion,
} from "./webinar";

export interface ParsedSheetTable {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface RawWorkbook {
  fileName: string;
  sheets: ParsedSheetTable[];
}

export interface ParsedWorkbookResult {
  adapter: "webinar3" | "canonical-template";
  sheetNames: string[];
  metadata: Partial<WebinarMetadata>;
  participants: Participant[];
  feedback: FeedbackResponse[];
  questions: WebinarQuestion[];
  narratives: Partial<WebinarNarratives> | null;
  issues: ValidationIssue[];
  rawRowCount: number;
  validRowCount: number;
  duplicateRowCount: number;
  duplicatesDiscarded: ImportAuditRow[];
  unmatchedPre: ImportAuditRow[];
  unmatchedPost: ImportAuditRow[];
  preDedupRows: Record<string, unknown>[];
  postDedupRows: Record<string, unknown>[];
  unitSummaryCrossCheck: Record<string, unknown>[];
  summarySheetComparison: ValidationIssue[];
}

export interface WizardMetadataForm {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  theme: string;
  date: string;
  speaker: string;
  seriesName: string;
  sourceName: string;
  population: string;
  attendanceThresholdMinutes: string;
}
