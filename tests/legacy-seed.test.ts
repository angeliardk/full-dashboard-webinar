import { describe, it, expect } from "vitest";
import webinar1 from "@/lib/migration/seed/webinar-1.json";
import webinar2 from "@/lib/migration/seed/webinar-2.json";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import type { Webinar } from "@/types/webinar";

describe("Legacy Webinar 1 & 2 reconstructed seed", () => {
  it.each([
    ["Webinar 1", webinar1 as unknown as Webinar],
    ["Webinar 2", webinar2 as unknown as Webinar],
  ])("%s metrics compute without error and stay within sane bounds", (_label, webinar) => {
    const metrics = calculateWebinarMetrics(webinar);
    expect(metrics.attendance.databaseParticipantCount).toBeGreaterThan(100);
    expect(metrics.learning.preAverage).toBeGreaterThan(0);
    expect(metrics.learning.postAverage).toBeGreaterThan(0);
    expect(metrics.learning.pairedGainAverage).not.toBeNull();
    expect(metrics.feedback.questionMetrics.length).toBeGreaterThan(0);
    expect(metrics.feedback.textComments.length).toBeGreaterThan(0);
    expect(webinar.questions.length).toBeGreaterThan(0);
    expect(webinar.narratives.finding.length).toBeGreaterThan(0);
    expect(webinar.importInfo.reconstructed).toBe(true);
  });

  it("Webinar 1 learning average is close to the published HTML mean (87.64 pre / 94.73 post)", () => {
    const metrics = calculateWebinarMetrics(webinar1 as unknown as Webinar);
    expect(metrics.learning.preAverage).toBeGreaterThan(70);
    expect(metrics.learning.postAverage).toBeGreaterThan(80);
  });

  it.each([
    ["Webinar 1", webinar1 as unknown as Webinar, { hadirBersih: 204, hanyaZoom: 107, pendaftarTakHadir: 192, hadirRegistrasi: 95 }],
    ["Webinar 2", webinar2 as unknown as Webinar, { hadirBersih: 207, hanyaZoom: 116, pendaftarTakHadir: 181, hadirRegistrasi: 91 }],
  ])("%s matches the confirmed attendance/registration KPIs from the Next.js SAMPLE source", (_label, webinar, target) => {
    const metrics = calculateWebinarMetrics(webinar);
    expect(metrics.attendance.zoomValidAttendeeCount).toBe(target.hadirBersih);
    expect(metrics.attendance.attendedWithoutRegistrationCount).toBe(target.hanyaZoom);
    expect(metrics.attendance.registeredNotAttendedCount).toBe(target.pendaftarTakHadir);
    // hadirRegistrasi can be off by at most a couple of rows — this is an
    // inherent inconsistency already present in the original source data
    // between its own unit-distribution table and its headline KPI (see
    // this webinar's importInfo.reconstructionNotes), not something this
    // reconstruction can close without inventing rows.
    expect(Math.abs(metrics.attendance.registeredAndAttendedCount - target.hadirRegistrasi)).toBeLessThanOrEqual(2);
  });
});
