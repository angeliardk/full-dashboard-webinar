import { describe, it, expect } from "vitest";
import webinar5 from "@/lib/migration/seed/webinar-5.json";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import { getSeedWebinars } from "@/lib/migration";
import type { Webinar } from "@/types/webinar";

describe("Webinar 5 baked-in seed", () => {
  const w5 = webinar5 as unknown as Webinar;

  it("is included in the seed list", () => {
    const seeds = getSeedWebinars();
    expect(seeds.map((w) => w.id)).toContain("w5");
  });

  it("never carries participant email, NIP, or phone", () => {
    expect(w5.participants.length).toBeGreaterThan(0);
    for (const p of w5.participants) {
      expect(p.email).toBeNull();
      expect(p.nip).toBeNull();
      expect(p.phone).toBeNull();
    }
  });

  it("never embeds a raw email/NIP inside identityKey either", () => {
    for (const p of w5.participants) {
      expect(p.identityKey).not.toMatch(/^email:/);
      expect(p.identityKey).not.toMatch(/^nip:/);
      expect(p.identityKey).not.toMatch(/@/);
    }
  });

  it("drops raw import audit rows (duplicates/unmatched/dedup dumps)", () => {
    expect(w5.importInfo.duplicatesDiscarded).toEqual([]);
    expect(w5.importInfo.unmatchedPre).toEqual([]);
    expect(w5.importInfo.unmatchedPost).toEqual([]);
    expect(w5.importInfo.preDedupRows).toEqual([]);
    expect(w5.importInfo.postDedupRows).toEqual([]);
    expect(w5.importInfo.unitSummaryCrossCheck).toEqual([]);
  });

  it("excludes ECADIN team, the BRIN speaker, and Kemenkeu staff, not real PLN participants", () => {
    const excludedNames = w5.participants.filter((p) => p.excluded).map((p) => p.name);
    expect(excludedNames).toEqual(
      expect.arrayContaining([
        "Angelia Regina",
        "ECADIN (Host)",
        "Nugroho Adi Sasongko",
        "Rifli Mubarak",
        "Hendro Ratnanto",
        "Lalu Taruna",
      ]),
    );
    for (const p of w5.participants.filter((p) => p.excluded)) {
      expect(p.exclusionReason).toBeTruthy();
    }
    // regression guard: a name that merely *contains* an excluded keyword as a
    // substring (e.g. "Sabrina" containing "brin") must not be swept in.
    expect(excludedNames).not.toEqual(expect.arrayContaining(["Windy Sabrina"]));
  });

  it("excluded participants are dropped from every computed metric", () => {
    const metrics = calculateWebinarMetrics(w5);
    const excludedCount = w5.participants.filter((p) => p.excluded).length;
    expect(metrics.attendance.databaseParticipantCount).toBe(w5.participants.length - excludedCount);
  });

  it("uses a 5-minute attendance threshold as the dashboard-wide basis (294, not the stricter 30-minute 268)", () => {
    expect(w5.metadata.attendanceThresholdMinutes).toBe(5);
    const metrics = calculateWebinarMetrics(w5);
    expect(metrics.attendance.registeredCount).toBeGreaterThan(400);
    expect(metrics.attendance.zoomValidAttendeeCount).toBe(294);
    // at a 5-minute threshold, zoomPresentCount (its own fixed >=5m/no-duration
    // rule) and zoomValidAttendeeCount converge on the same number.
    expect(metrics.attendance.zoomValidAttendeeCount).toBe(metrics.attendance.zoomPresentCount);
    expect(metrics.attendance.zoomValidAttendeeCount).toBeLessThan(metrics.attendance.registeredCount);
    for (const p of w5.participants.filter((p) => !p.excluded)) {
      if (p.attendance.zoomDurationMinutes != null) {
        expect(p.attendance.zoomValidAttendee).toBe(p.attendance.zoomDurationMinutes >= 5);
      }
    }
  });

  it("excludes the single-letter junk pre-test submission", () => {
    const junk = w5.participants.find((p) => p.name.trim() === "a");
    expect(junk).toBeDefined();
    expect(junk?.excluded).toBe(true);
    expect(junk?.exclusionReason).toBeTruthy();
  });

  it("computes sane, non-zero KPI numbers purely from participant data (nothing hand-typed)", () => {
    const metrics = calculateWebinarMetrics(w5);
    expect(metrics.learning.preRespondentCount).toBeGreaterThan(50);
    expect(metrics.learning.postRespondentCount).toBeGreaterThan(50);
    expect(metrics.learning.pairedCount).toBeGreaterThan(30);
    expect(metrics.feedback.responseCount).toBeGreaterThan(0);
    expect(w5.kpiOverrides).toBeUndefined();
  });

  it("keeps all 11 deduped Q&A questions and real feedback rows intact", () => {
    expect(w5.questions.length).toBe(11);
    expect(w5.feedback.length).toBeGreaterThan(0);
  });
});
