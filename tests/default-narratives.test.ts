import { describe, it, expect } from "vitest";
import { generateDefaultNarratives } from "@/lib/narratives/default-narratives";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import { emptyNarratives } from "@/types/webinar";
import { makeFeedback, makeParticipant } from "./fixtures/participant-factory";
import type { Webinar } from "@/types/webinar";

function makeWebinar(overrides: Partial<Webinar> = {}): Webinar {
  return {
    id: "w-test",
    number: 1,
    metadata: {
      id: "w-test", number: 1, title: "Contoh", subtitle: "", theme: "", date: "2026-01-01",
      speaker: "", seriesName: "", sourceName: "test.xlsx", population: null, attendanceThresholdMinutes: 30,
    },
    participants: [],
    feedback: [],
    questions: [],
    narratives: emptyNarratives(),
    importInfo: {
      sourceFileName: "test.xlsx", sourceSheetNames: [], importedAt: new Date().toISOString(), adapter: "canonical-template",
      rawRowCount: 0, validRowCount: 0, duplicateRowCount: 0, issues: [], duplicatesDiscarded: [], unmatchedPre: [],
      unmatchedPost: [], preDedupRows: [], postDedupRows: [], unitSummaryCrossCheck: [], reconstructed: false,
    },
    ...overrides,
  };
}

describe("generateDefaultNarratives", () => {
  it("produces a headline finding sentence with no em-dash compound clauses", () => {
    const p1 = makeParticipant({ attendance: { ...makeParticipant().attendance, registeredEcadin: true, zoomValidAttendee: true } });
    const webinar = makeWebinar({ participants: [p1] });
    const metrics = calculateWebinarMetrics(webinar);
    const narratives = generateDefaultNarratives(webinar, metrics);

    expect(narratives.finding.length).toBeGreaterThan(0);
    for (const section of [narratives.finding, narratives.strength, narratives.improvement, narratives.recommendation, narratives.limitation]) {
      for (const item of section) {
        expect(item.text).not.toContain(" — ");
      }
    }
  });

  it("flags reconstructed data and missing demographics as limitations", () => {
    const p1 = makeParticipant();
    const webinar = makeWebinar({
      participants: [p1],
      importInfo: { ...makeWebinar().importInfo, reconstructed: true },
    });
    const metrics = calculateWebinarMetrics(webinar);
    const narratives = generateDefaultNarratives(webinar, metrics);
    const allLimitations = narratives.limitation.map((n) => n.text).join(" ");
    expect(allLimitations).toContain("rekonstruksi");
    expect(allLimitations).toContain("demografi");
  });

  it("highlights the highest and lowest-scoring feedback questions separately", () => {
    const feedback = [
      makeFeedback({ question: "Materi", valueNumeric: 5, participantId: "p-1" }),
      makeFeedback({ question: "Materi", valueNumeric: 5, participantId: "p-2" }),
      makeFeedback({ question: "Durasi", valueNumeric: 2, participantId: "p-1" }),
      makeFeedback({ question: "Durasi", valueNumeric: 2, participantId: "p-2" }),
    ];
    const webinar = makeWebinar({ feedback });
    const metrics = calculateWebinarMetrics(webinar);
    const narratives = generateDefaultNarratives(webinar, metrics);
    expect(narratives.strength.some((n) => n.text.includes("Materi"))).toBe(true);
    expect(narratives.improvement.some((n) => n.text.includes("Durasi"))).toBe(true);
  });
});
