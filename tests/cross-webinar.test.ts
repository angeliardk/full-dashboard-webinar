import { describe, it, expect } from "vitest";
import { calculateCrossWebinarMetrics } from "@/lib/analytics/cross-webinar";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import webinar1 from "@/lib/migration/seed/webinar-1.json";
import webinar2 from "@/lib/migration/seed/webinar-2.json";
import type { Webinar } from "@/types/webinar";

describe("calculateCrossWebinarMetrics", () => {
  it("sums totals across already-resolved (webinar, metrics) entries instead of recomputing from participants", () => {
    const w1 = webinar1 as unknown as Webinar;
    const w2 = webinar2 as unknown as Webinar;
    const m1 = calculateWebinarMetrics(w1);
    const m2 = calculateWebinarMetrics(w2);
    const result = calculateCrossWebinarMetrics([
      { webinar: w1, metrics: m1 },
      { webinar: w2, metrics: m2 },
    ]);
    expect(result.webinarCount).toBe(2);
    expect(result.totalZoomValidAttendees).toBe(m1.attendance.zoomValidAttendeeCount + m2.attendance.zoomValidAttendeeCount);
    expect(result.totalRegistered).toBe(m1.attendance.registeredCount + m2.attendance.registeredCount);
  });

  it("respects a manually overridden metrics value passed in, since it never recomputes from participants", () => {
    const w1 = webinar1 as unknown as Webinar;
    const baseMetrics = calculateWebinarMetrics(w1);
    const overridden = { ...baseMetrics, attendance: { ...baseMetrics.attendance, zoomValidAttendeeCount: 999 } };
    const result = calculateCrossWebinarMetrics([{ webinar: w1, metrics: overridden }]);
    expect(result.totalZoomValidAttendees).toBe(999);
    expect(result.attendanceByWebinar[0].value).toBe(999);
  });

  it("sorts entries by webinar number regardless of input order", () => {
    const w1 = webinar1 as unknown as Webinar;
    const w2 = webinar2 as unknown as Webinar;
    const m1 = calculateWebinarMetrics(w1);
    const m2 = calculateWebinarMetrics(w2);
    const result = calculateCrossWebinarMetrics([
      { webinar: w2, metrics: m2 },
      { webinar: w1, metrics: m1 },
    ]);
    expect(result.attendanceByWebinar.map((p) => p.webinarNumber)).toEqual([1, 2]);
  });
});
