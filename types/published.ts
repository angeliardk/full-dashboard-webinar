/**
 * The subset of a Webinar that gets published to shared storage so every
 * visitor sees the same numbers, without any participant-level data (name,
 * email, NIP, phone, raw import audit rows) ever leaving the browser that
 * uploaded/edited it. Only aggregated, already-computed values travel.
 */
import type { ValidationIssue, WebinarMetadata, WebinarNarratives, WebinarQuestion } from "./webinar";
import type { WebinarMetrics } from "./analytics";

export interface PublishedImportInfo {
  sourceFileName: string | null;
  sourceSheetNames: string[];
  importedAt: string;
  adapter: "webinar3" | "canonical-template" | "legacy-migration" | "manual";
  rawRowCount: number;
  validRowCount: number;
  duplicateRowCount: number;
  issues: ValidationIssue[];
  reconstructed?: boolean;
  reconstructionNotes?: string[];
}

export interface PublishedWebinarSnapshot {
  id: string;
  number: number;
  metadata: WebinarMetadata;
  metrics: WebinarMetrics;
  overriddenKeys: string[];
  narratives: WebinarNarratives;
  questions: WebinarQuestion[];
  importInfo: PublishedImportInfo;
  publishedAt: string;
}

export interface PublishedStore {
  webinars: Record<string, PublishedWebinarSnapshot>;
  updatedAt: string | null;
}

export function emptyPublishedStore(): PublishedStore {
  return { webinars: {}, updatedAt: null };
}
