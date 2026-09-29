import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { readWorkbookFile } from "@/lib/excel/workbook-parser";
import { parseWebinar3Workbook } from "@/lib/excel/webinar3-adapter";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";

// This suite validates the parser against the real Webinar 3 acceptance
// numbers from the task brief. The source file contains real employee PII
// so it is never committed to the repo — point REAL_WEBINAR3_PATH at a
// local copy to run it; otherwise it's skipped automatically.
const REAL_PATH = process.env.REAL_WEBINAR3_PATH;
const hasRealFile = !!REAL_PATH && existsSync(REAL_PATH);

describe.skipIf(!hasRealFile)("Webinar 3 acceptance numbers (real file)", () => {
  it("reproduces every published acceptance figure", async () => {
    const buffer = readFileSync(REAL_PATH as string);
    const file = new File([buffer], "PLN_Webinar_3.xlsx");
    const workbook = await readWorkbookFile(file);
    const parsed = parseWebinar3Workbook(workbook, { attendanceThresholdMinutes: 30 });

    expect(parsed.adapter).toBe("webinar3");
    expect(parsed.participants.length).toBe(450);

    const metrics = calculateWebinarMetrics({
      id: "w3", number: 3,
      metadata: {} as never,
      participants: parsed.participants,
      feedback: parsed.feedback,
      questions: [],
      narratives: {} as never,
      importInfo: {} as never,
    });

    expect(metrics.attendance.registeredCount).toBe(253);
    expect(metrics.attendance.zoomValidAttendeeCount).toBe(211);
    expect(metrics.attendance.registeredAndAttendedCount).toBe(76);
    expect(metrics.attendance.attendedWithoutRegistrationCount).toBe(135);
    expect(metrics.attendance.registeredNotAttendedCount).toBe(177);

    expect(metrics.learning.preRespondentCount).toBe(92);
    expect(metrics.learning.postRespondentCount).toBe(73);
    expect(metrics.learning.pairedCount).toBe(48);
    expect(metrics.learning.improvedCount).toBe(31);
    expect(metrics.learning.sameCount).toBe(16);
    expect(metrics.learning.declinedCount).toBe(1);

    expect(metrics.learning.preAverage).toBeCloseTo(70.72, 1);
    expect(metrics.learning.postAverage).toBeCloseTo(89.79, 1);
    expect(metrics.learning.pairedGainAverage).toBeCloseTo(16.02, 1);

    expect(metrics.learning.prePerfectCount).toBe(25);
    expect(metrics.learning.postPerfectCount).toBe(41);
    expect(metrics.learning.bothPerfectCount).toBe(15);

    expect(metrics.feedback.distinctRespondentCount).toBeGreaterThan(0);
    const likertQs = metrics.feedback.questionMetrics.filter((q) => q.type === "likert");
    expect(likertQs.length).toBe(8);
    for (const q of likertQs) {
      expect(q.responseCount).toBeGreaterThanOrEqual(72);
      expect(q.responseCount).toBeLessThanOrEqual(73);
      expect(q.average).toBeGreaterThanOrEqual(4.1);
      expect(q.average).toBeLessThanOrEqual(4.35);
    }

    expect(parsed.unmatchedPre.length).toBe(1);
  });
});
