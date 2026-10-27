import { describe, it, expect } from "vitest";
import webinar6 from "@/lib/migration/seed/webinar-6.json";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import { calculateCompanyGroupDistribution, classifyPlnCompanyGroup } from "@/lib/analytics/pln-company-group";
import { getSeedWebinars } from "@/lib/migration";
import type { Webinar } from "@/types/webinar";

describe("Webinar 6 baked-in seed", () => {
  const w6 = webinar6 as unknown as Webinar;

  it("is included in the seed list", () => {
    const seeds = getSeedWebinars();
    expect(seeds.map((w) => w.id)).toContain("w6");
  });

  it("never carries participant email, NIP, or phone", () => {
    expect(w6.participants.length).toBeGreaterThan(0);
    for (const p of w6.participants) {
      expect(p.email).toBeNull();
      expect(p.nip).toBeNull();
      expect(p.phone).toBeNull();
    }
  });

  it("never embeds a raw email/NIP inside identityKey either", () => {
    for (const p of w6.participants) {
      expect(p.identityKey).not.toMatch(/^email:/);
      expect(p.identityKey).not.toMatch(/^nip:/);
      expect(p.identityKey).not.toMatch(/@/);
    }
  });

  it("drops raw import audit rows (duplicates/unmatched/dedup dumps)", () => {
    expect(w6.importInfo.duplicatesDiscarded).toEqual([]);
    expect(w6.importInfo.unmatchedPre).toEqual([]);
    expect(w6.importInfo.unmatchedPost).toEqual([]);
    expect(w6.importInfo.preDedupRows).toEqual([]);
    expect(w6.importInfo.postDedupRows).toEqual([]);
    expect(w6.importInfo.unitSummaryCrossCheck).toEqual([]);
  });

  it("excludes ECADIN team, the speakers, and the BRIN registrant, not real PLN participants", () => {
    const excludedNames = w6.participants.filter((p) => p.excluded).map((p) => p.name);
    expect(excludedNames).toEqual(
      expect.arrayContaining([
        "Angelia Regina",
        "Mohammad Shariful Islam",
        "Netty Herawati",
        "Aker Yunil Fuad",
        "Azzam Aulia",
        "Rifli Mubarak",
        "Layla Salma",
        "Listia Khairunnisa",
        "Nabila Azizah",
      ]),
    );
    expect(excludedNames.length).toBe(9);
    for (const p of w6.participants.filter((p) => p.excluded)) {
      expect(p.exclusionReason).toBeTruthy();
    }
    // regression guard: a name that merely *contains* an excluded keyword as a
    // substring (e.g. "eka putri" / "febrina87eka@gmail.com" containing "brin")
    // must not be swept in -- same bug class as Webinar 5's "Sabrina".
    expect(excludedNames).not.toEqual(expect.arrayContaining(["eka putri"]));
    // a same-name coincidence with a different webinar's excluded staffer
    // (Webinar 4's "Fitra Arsyad Rofi") must not exclude this real PLN employee.
    const fitra = w6.participants.find((p) => p.name === "Fitra Arsyad Rofi");
    expect(fitra).toBeDefined();
    expect(fitra?.excluded).toBe(false);
  });

  it("excluded participants are dropped from every computed metric", () => {
    const metrics = calculateWebinarMetrics(w6);
    const excludedCount = w6.participants.filter((p) => p.excluded).length;
    expect(metrics.attendance.databaseParticipantCount).toBe(w6.participants.length - excludedCount);
  });

  it("counts every registrant (minus only the organizer/speaker/BRIN exclusions) toward total registered", () => {
    expect(w6.metadata.attendanceThresholdMinutes).toBe(5);
    const metrics = calculateWebinarMetrics(w6);
    expect(metrics.attendance.registeredCount).toBe(542);
  });

  it("uses a 5-minute attendance threshold, converging zoomValidAttendeeCount with zoomPresentCount", () => {
    const metrics = calculateWebinarMetrics(w6);
    expect(metrics.attendance.zoomValidAttendeeCount).toBeGreaterThan(0);
    expect(metrics.attendance.zoomValidAttendeeCount).toBe(metrics.attendance.zoomPresentCount);
    expect(metrics.attendance.zoomValidAttendeeCount).toBeLessThan(metrics.attendance.registeredCount);
    for (const p of w6.participants.filter((p) => !p.excluded)) {
      if (p.attendance.zoomDurationMinutes != null) {
        expect(p.attendance.zoomValidAttendee).toBe(p.attendance.zoomDurationMinutes >= 5);
      }
    }
  });

  it("computes sane, non-zero KPI numbers purely from participant data (nothing hand-typed)", () => {
    const metrics = calculateWebinarMetrics(w6);
    expect(metrics.learning.preRespondentCount).toBeGreaterThan(50);
    expect(metrics.learning.postRespondentCount).toBeGreaterThan(30);
    expect(metrics.learning.pairedCount).toBeGreaterThan(20);
    expect(metrics.feedback.responseCount).toBeGreaterThan(0);
    expect(w6.kpiOverrides).toBeUndefined();
  });

  it("keeps all 9 curated Q&A questions from chat.txt and real feedback rows intact", () => {
    expect(w6.questions.length).toBe(9);
    expect(w6.feedback.length).toBeGreaterThan(0);
    // announcements/boilerplate ("ECADIN", "Ecadin Team") must never appear as an asker
    for (const q of w6.questions) {
      expect(q.askerName).not.toMatch(/ecadin/i);
    }
  });

  it("keeps a real 'Nama Perusahaan' company field distinct from unitFinal, so company grouping isn't guessed from a specific office name", () => {
    const naufal = w6.participants.find((p) => p.name === "Naufal Abiyyudien");
    expect(naufal).toBeDefined();
    // real row: company "PLN", unit "UPP Nusa Tenggara 3" -- unitFinal alone has no
    // "pln" substring, so without a distinct company field this person would
    // misclassify as "Lainnya / Eksternal" instead of "PLN Pusat".
    expect(naufal?.company).toBe("PLN");
    expect(naufal?.unitFinal).not.toMatch(/pln/i);
    // classifying from unitFinal alone would wrongly land him in "Lainnya / Eksternal";
    // classifying from the real company field correctly lands him in "PLN Pusat".
    expect(classifyPlnCompanyGroup(naufal!.company)).toBe("PLN Pusat");
    expect(classifyPlnCompanyGroup(naufal!.unitFinal)).not.toBe("PLN Pusat");

    const groups = calculateCompanyGroupDistribution(w6.participants);
    const groupNames = groups.map((g) => g.unit);
    expect(groupNames).toEqual(expect.arrayContaining(["PLN Pusat", "PLN Nusantara Power"]));
  });

  it("resolves crossWebinarKey for most participants, with no collision among active ones", () => {
    const withKey = w6.participants.filter((p) => p.crossWebinarKey);
    expect(withKey.length).toBeGreaterThan(400);
    const activeKeys = w6.participants.filter((p) => !p.excluded && p.crossWebinarKey).map((p) => p.crossWebinarKey);
    expect(new Set(activeKeys).size).toBe(activeKeys.length);
  });
});
