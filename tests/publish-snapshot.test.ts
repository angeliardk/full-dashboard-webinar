import { describe, it, expect } from "vitest";
import { buildPublishedSnapshot, buildShellWebinar } from "@/lib/publish/build-snapshot";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import webinar1 from "@/lib/migration/seed/webinar-1.json";
import type { Webinar } from "@/types/webinar";

describe("buildPublishedSnapshot", () => {
  const w1 = webinar1 as unknown as Webinar;
  const metrics = calculateWebinarMetrics(w1);

  it("never includes the participants array (no PII leaves the browser)", () => {
    const snapshot = buildPublishedSnapshot(w1, metrics, new Set(["attendance.zoomValidAttendeeCount"]));
    expect(snapshot as unknown as Record<string, unknown>).not.toHaveProperty("participants");
  });

  it("strips raw audit rows out of importInfo, keeping only aggregate counts and issues", () => {
    const snapshot = buildPublishedSnapshot(w1, metrics, new Set());
    expect(snapshot.importInfo).not.toHaveProperty("duplicatesDiscarded");
    expect(snapshot.importInfo).not.toHaveProperty("unmatchedPre");
    expect(snapshot.importInfo).not.toHaveProperty("preDedupRows");
    expect(snapshot.importInfo.rawRowCount).toBe(w1.importInfo.rawRowCount);
    expect(snapshot.importInfo.issues).toEqual(w1.importInfo.issues);
  });

  it("records which keys are manually overridden", () => {
    const snapshot = buildPublishedSnapshot(w1, metrics, new Set(["learning.preAverage", "attendance.registeredCount"]));
    expect(snapshot.overriddenKeys.sort()).toEqual(["attendance.registeredCount", "learning.preAverage"]);
  });

  it("round-trips into a shell webinar whose metrics-relevant fields match, with empty participants/feedback and no audit rows", () => {
    const snapshot = buildPublishedSnapshot(w1, metrics, new Set());
    const shell = buildShellWebinar(snapshot);
    expect(shell.id).toBe(w1.id);
    expect(shell.number).toBe(w1.number);
    expect(shell.metadata).toEqual(w1.metadata);
    expect(shell.participants).toEqual([]);
    expect(shell.feedback).toEqual([]);
    expect(shell.importInfo.duplicatesDiscarded).toEqual([]);
    expect(shell.importInfo.unmatchedPre).toEqual([]);
    expect(shell.narratives).toEqual(w1.narratives);
    expect(shell.questions).toEqual(w1.questions);
  });
});
