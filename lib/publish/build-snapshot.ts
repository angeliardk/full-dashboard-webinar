import type { Webinar } from "@/types/webinar";
import type { WebinarMetrics } from "@/types/analytics";
import type { PublishedWebinarSnapshot } from "@/types/published";
import { emptyNarratives } from "@/types/webinar";

export function buildPublishedSnapshot(
  webinar: Webinar,
  metrics: WebinarMetrics,
  overriddenKeys: Set<string>,
): PublishedWebinarSnapshot {
  return {
    id: webinar.id,
    number: webinar.number,
    metadata: webinar.metadata,
    metrics,
    overriddenKeys: [...overriddenKeys],
    narratives: webinar.narratives,
    questions: webinar.questions,
    importInfo: {
      sourceFileName: webinar.importInfo.sourceFileName,
      sourceSheetNames: webinar.importInfo.sourceSheetNames,
      importedAt: webinar.importInfo.importedAt,
      adapter: webinar.importInfo.adapter,
      rawRowCount: webinar.importInfo.rawRowCount,
      validRowCount: webinar.importInfo.validRowCount,
      duplicateRowCount: webinar.importInfo.duplicateRowCount,
      issues: webinar.importInfo.issues,
      reconstructed: webinar.importInfo.reconstructed,
      reconstructionNotes: webinar.importInfo.reconstructionNotes,
    },
    publishedAt: new Date().toISOString(),
  };
}

/**
 * Reconstructs a read-only "shell" Webinar for a visitor's browser that
 * never uploaded this webinar's Excel file itself — no participant rows
 * exist locally, so `participants`/`feedback` stay empty. Every number
 * shown for it comes from the snapshot's already-computed `metrics`
 * instead of being recalculated from (empty) participants.
 */
export function buildShellWebinar(snapshot: PublishedWebinarSnapshot): Webinar {
  return {
    id: snapshot.id,
    number: snapshot.number,
    metadata: snapshot.metadata,
    participants: [],
    feedback: [],
    questions: snapshot.questions,
    narratives: snapshot.narratives ?? emptyNarratives(),
    importInfo: {
      sourceFileName: snapshot.importInfo.sourceFileName,
      sourceSheetNames: snapshot.importInfo.sourceSheetNames,
      importedAt: snapshot.importInfo.importedAt,
      adapter: snapshot.importInfo.adapter,
      rawRowCount: snapshot.importInfo.rawRowCount,
      validRowCount: snapshot.importInfo.validRowCount,
      duplicateRowCount: snapshot.importInfo.duplicateRowCount,
      issues: snapshot.importInfo.issues,
      duplicatesDiscarded: [],
      unmatchedPre: [],
      unmatchedPost: [],
      preDedupRows: [],
      postDedupRows: [],
      unitSummaryCrossCheck: [],
      reconstructed: snapshot.importInfo.reconstructed,
      reconstructionNotes: snapshot.importInfo.reconstructionNotes,
    },
  };
}
