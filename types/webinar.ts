/**
 * Core dynamic data model. Nothing in this file (or anywhere downstream)
 * may reference a specific webinar id like "w1"/"w2" — webinars are always
 * an array/map, and the number of webinars is unbounded.
 */

export interface ParticipantAttendance {
  /** Registered through the ECADIN / registration form. */
  registeredEcadin: boolean;
  /** Marked present on the Zoom-based attendance form. */
  attendedZoomForm: boolean;
  /** Present in the raw Zoom CSV export. */
  inZoomCsv: boolean;
  /** Attended Zoom above the webinar's attendance threshold (default 30 minutes). */
  zoomValidAttendee: boolean;
  zoomDurationMinutes: number | null;
  zoomJoinCount: number | null;
  zoomDisplayName: string | null;
}

export interface ParticipantLearning {
  tookPre: boolean;
  preTimestamp: string | null;
  preCorrect: number | null;
  preWrong: number | null;
  preScore: number | null;
  preAnswers: string | null;
  tookPost: boolean;
  postTimestamp: string | null;
  postCorrect: number | null;
  postWrong: number | null;
  postScore: number | null;
  postAnswers: string | null;
  scoreDelta: number | null;
  scoreChangeStatus: string | null;
  hasPrePost: boolean;
}

export interface Participant {
  id: string;
  /** Deterministic identity key used for dedup/matching (see identity-key rules). */
  identityKey: string;
  identityKeySource: "email" | "nip" | "participant-key" | "name-unit" | "name-only";
  name: string;
  email: string | null;
  nip: string | null;
  phone: string | null;
  unitFinal: string;
  unitSource: string | null;
  identificationCategory: string | null;
  gender: string | null;
  age: number | null;
  education: string | null;
  position: string | null;
  attendance: ParticipantAttendance;
  learning: ParticipantLearning;
  feedbackSubmitted: boolean;
  statusPengisian: string | null;
  dataSource: string | null;
  notes: string | null;
  excluded: boolean;
  exclusionReason: string | null;
  suspectedTestJunk: boolean;
  suspectedTestJunkReason: string | null;
}

export type FeedbackQuestionType = "likert" | "text";

export interface FeedbackResponse {
  id: string;
  participantId: string | null;
  question: string;
  type: FeedbackQuestionType;
  valueNumeric: number | null;
  valueText: string | null;
  /** Deterministic keyword category; admin-correctable. */
  category: string | null;
  categoryEdited: boolean;
}

export interface WebinarQuestion {
  id: string;
  time: string | null;
  askerName: string | null;
  unit: string | null;
  question: string;
}

export interface NarrativeItem {
  id: string;
  text: string;
  order: number;
  edited: boolean;
}

export type NarrativeType =
  | "finding"
  | "strength"
  | "improvement"
  | "recommendation"
  | "limitation";

export type WebinarNarratives = Record<NarrativeType, NarrativeItem[]>;

export interface ValidationIssue {
  level: "error" | "warning" | "info";
  code: string;
  message: string;
  count?: number;
}

export interface ImportAuditRow {
  reason: string;
  raw: Record<string, unknown>;
}

export interface ImportInfo {
  sourceFileName: string | null;
  sourceSheetNames: string[];
  importedAt: string;
  adapter: "webinar3" | "canonical-template" | "legacy-migration" | "manual";
  rawRowCount: number;
  validRowCount: number;
  duplicateRowCount: number;
  issues: ValidationIssue[];
  duplicatesDiscarded: ImportAuditRow[];
  unmatchedPre: ImportAuditRow[];
  unmatchedPost: ImportAuditRow[];
  preDedupRows: Record<string, unknown>[];
  postDedupRows: Record<string, unknown>[];
  unitSummaryCrossCheck: Record<string, unknown>[];
  reconstructed?: boolean;
  reconstructionNotes?: string[];
}

export interface WebinarMetadata {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  theme: string;
  date: string;
  speaker: string;
  seriesName: string;
  sourceName: string;
  population: number | null;
  attendanceThresholdMinutes: number;
}

export interface Webinar {
  id: string;
  number: number;
  metadata: WebinarMetadata;
  participants: Participant[];
  feedback: FeedbackResponse[];
  questions: WebinarQuestion[];
  narratives: WebinarNarratives;
  importInfo: ImportInfo;
  /**
   * Manual admin overrides for any computed KPI number, keyed by a dotted
   * path into WebinarMetrics (see lib/analytics/kpi-overrides.ts). Optional —
   * absent/empty means every number is the computed value, as before.
   */
  kpiOverrides?: Record<string, number>;
}

export interface DashboardSettings {
  selectedWebinarId: string | null;
  selectedTab: string;
  editMode: boolean;
}

export interface DashboardStore {
  schemaVersion: number;
  webinars: Webinar[];
  settings: DashboardSettings;
}

export const SCHEMA_VERSION = 1;

export function emptyNarratives(): WebinarNarratives {
  return { finding: [], strength: [], improvement: [], recommendation: [], limitation: [] };
}
