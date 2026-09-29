import { describe, it, expect } from "vitest";
import webinar4 from "@/lib/migration/seed/webinar-4.json";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import { getSeedWebinars } from "@/lib/migration";
import type { Webinar } from "@/types/webinar";

describe("Webinar 4 baked-in seed", () => {
  const w4 = webinar4 as unknown as Webinar;

  it("is included in the seed list", () => {
    const seeds = getSeedWebinars();
    expect(seeds.map((w) => w.id)).toContain("w4");
  });

  it("never carries participant email, NIP, or phone", () => {
    expect(w4.participants.length).toBeGreaterThan(0);
    for (const p of w4.participants) {
      expect(p.email).toBeNull();
      expect(p.nip).toBeNull();
      expect(p.phone).toBeNull();
    }
  });

  it("never embeds a raw email/NIP inside identityKey either", () => {
    for (const p of w4.participants) {
      expect(p.identityKey).not.toMatch(/^email:/);
      expect(p.identityKey).not.toMatch(/^nip:/);
      expect(p.identityKey).not.toMatch(/@/);
    }
  });

  it("drops raw import audit rows (duplicates/unmatched/dedup dumps)", () => {
    expect(w4.importInfo.duplicatesDiscarded).toEqual([]);
    expect(w4.importInfo.unmatchedPre).toEqual([]);
    expect(w4.importInfo.unmatchedPost).toEqual([]);
    expect(w4.importInfo.preDedupRows).toEqual([]);
    expect(w4.importInfo.postDedupRows).toEqual([]);
    expect(w4.importInfo.unitSummaryCrossCheck).toEqual([]);
  });

  it("excludes the confirmed speakers (BRIN/IAEA) and ECADIN team members", () => {
    const excludedNames = w4.participants.filter((p) => p.excluded).map((p) => p.name);
    expect(excludedNames).toEqual(
      expect.arrayContaining(["Angelia Regina", "ECADIN (Host)", "Nuri Trianti", "Azzam Aulia R", "Benoît Lepouzé", "Fitra Arsyad Rofi"]),
    );
    for (const p of w4.participants.filter((p) => p.excluded)) {
      expect(p.exclusionReason).toBeTruthy();
    }
  });

  it("excluded participants are dropped from every computed metric", () => {
    const metrics = calculateWebinarMetrics(w4);
    const excludedCount = w4.participants.filter((p) => p.excluded).length;
    expect(metrics.attendance.databaseParticipantCount).toBe(w4.participants.length - excludedCount);
  });

  it("computes sane, non-zero KPI numbers purely from participant data (nothing hand-typed)", () => {
    const metrics = calculateWebinarMetrics(w4);
    expect(metrics.attendance.registeredCount).toBeGreaterThan(600);
    expect(metrics.attendance.zoomValidAttendeeCount).toBeGreaterThan(300);
    expect(metrics.learning.preRespondentCount).toBeGreaterThan(100);
    expect(metrics.learning.postRespondentCount).toBeGreaterThan(100);
    expect(metrics.learning.pairedCount).toBeGreaterThan(50);
    expect(metrics.feedback.responseCount).toBeGreaterThan(0);
    expect(w4.kpiOverrides).toBeUndefined();
  });

  it("keeps all 21 deduped Q&A questions and real feedback rows intact", () => {
    expect(w4.questions.length).toBe(21);
    expect(w4.feedback.length).toBeGreaterThan(0);
  });
});
