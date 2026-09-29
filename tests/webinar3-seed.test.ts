import { describe, it, expect } from "vitest";
import webinar3 from "@/lib/migration/seed/webinar-3.json";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import { applyKpiOverrides } from "@/lib/analytics/kpi-overrides";
import { getSeedWebinars } from "@/lib/migration";
import type { Webinar } from "@/types/webinar";

describe("Webinar 3 baked-in seed", () => {
  const w3 = webinar3 as unknown as Webinar;

  it("is included in the seed list", () => {
    const seeds = getSeedWebinars();
    expect(seeds.map((w) => w.id)).toContain("w3");
  });

  it("never carries participant email, NIP, or phone", () => {
    expect(w3.participants.length).toBeGreaterThan(0);
    for (const p of w3.participants) {
      expect(p.email).toBeNull();
      expect(p.nip).toBeNull();
      expect(p.phone).toBeNull();
    }
  });

  it("never embeds a raw email/NIP inside identityKey either", () => {
    for (const p of w3.participants) {
      expect(p.identityKey).not.toMatch(/^email:/);
      expect(p.identityKey).not.toMatch(/^nip:/);
      expect(p.identityKey).not.toMatch(/@/);
    }
  });

  it("drops raw import audit rows (duplicates/unmatched/dedup dumps)", () => {
    expect(w3.importInfo.duplicatesDiscarded).toEqual([]);
    expect(w3.importInfo.unmatchedPre).toEqual([]);
    expect(w3.importInfo.unmatchedPost).toEqual([]);
    expect(w3.importInfo.preDedupRows).toEqual([]);
    expect(w3.importInfo.postDedupRows).toEqual([]);
    expect(w3.importInfo.unitSummaryCrossCheck).toEqual([]);
  });

  it("matches the confirmed KPI numbers once kpiOverrides are applied", () => {
    const raw = calculateWebinarMetrics(w3);
    const { metrics, overriddenKeys } = applyKpiOverrides(raw, w3.kpiOverrides);
    expect(metrics.attendance.databaseParticipantCount).toBe(408);
    expect(metrics.attendance.registeredCount).toBe(408);
    expect(metrics.attendance.zoomValidAttendeeCount).toBe(209);
    expect(metrics.attendance.registeredAndAttendedCount).toBe(209);
    expect(metrics.attendance.attendedWithoutRegistrationCount).toBe(0);
    expect(metrics.attendance.registeredNotAttendedCount).toBe(199);
    expect(metrics.learning.preRespondentCount).toBe(93);
    expect(overriddenKeys.size).toBe(7);
  });

  it("keeps the 8 curated Questions and real feedback rows intact", () => {
    expect(w3.questions.length).toBe(8);
    expect(w3.feedback.length).toBeGreaterThan(0);
  });
});
