import { describe, it, expect } from "vitest";
import { applyKpiOverrides, KPI_FIELDS, KPI_FIELD_GROUPS } from "@/lib/analytics/kpi-overrides";
import type { WebinarMetrics } from "@/types/analytics";

function baseMetrics(): WebinarMetrics {
  return {
    attendance: {
      databaseParticipantCount: 100,
      registeredCount: 90,
      zoomPresentCount: 84,
      zoomValidAttendeeCount: 80,
      registeredAndAttendedCount: 70,
      attendedWithoutRegistrationCount: 10,
      registeredNotAttendedCount: 20,
      unidentifiedUnitCount: 5,
      belowThresholdZoomCount: 3,
    },
    learning: {
      preRespondentCount: 60,
      postRespondentCount: 55,
      pairedCount: 50,
      preAverage: 70,
      postAverage: 85,
      pairedGainAverage: 15,
      pairedPreAverage: 68,
      pairedPostAverage: 86,
      improvedCount: 40,
      sameCount: 5,
      declinedCount: 5,
      preDistribution: [],
      postDistribution: [],
      gainDistribution: [],
      prePerfectCount: 2,
      postPerfectCount: 10,
      bothPerfectCount: 1,
      perfectScoreParticipants: [],
      preMin: 0,
      preMax: 100,
      postMin: 0,
      postMax: 100,
      pairs: [],
    },
    feedback: {
      responseCount: 200,
      distinctRespondentCount: 40,
      questionMetrics: [],
      categoryDistribution: [],
      textComments: [],
    },
    units: [],
    questions: null,
    completion: { preRate: 75, postRate: 68, feedbackRate: 50 },
  };
}

describe("applyKpiOverrides", () => {
  it("returns the same metrics object and an empty set when there are no overrides", () => {
    const metrics = baseMetrics();
    const { metrics: result, overriddenKeys } = applyKpiOverrides(metrics, undefined);
    expect(result).toBe(metrics);
    expect(overriddenKeys.size).toBe(0);
  });

  it("replaces an overridden field's value and marks it as overridden", () => {
    const metrics = baseMetrics();
    const { metrics: result, overriddenKeys } = applyKpiOverrides(metrics, { "attendance.zoomValidAttendeeCount": 999 });
    expect(result.attendance.zoomValidAttendeeCount).toBe(999);
    expect(overriddenKeys.has("attendance.zoomValidAttendeeCount")).toBe(true);
  });

  it("does not mutate the original metrics object", () => {
    const metrics = baseMetrics();
    applyKpiOverrides(metrics, { "learning.preAverage": 1 });
    expect(metrics.learning.preAverage).toBe(70);
  });

  it("leaves every non-overridden field untouched", () => {
    const metrics = baseMetrics();
    const { metrics: result } = applyKpiOverrides(metrics, { "attendance.registeredCount": 500 });
    expect(result.attendance.databaseParticipantCount).toBe(100);
    expect(result.learning.preAverage).toBe(70);
    expect(result.feedback.distinctRespondentCount).toBe(40);
  });

  it("ignores unknown keys and NaN values", () => {
    const metrics = baseMetrics();
    const { overriddenKeys } = applyKpiOverrides(metrics, { "not.a.real.field": 5, "learning.preAverage": Number.NaN });
    expect(overriddenKeys.size).toBe(0);
  });

  it("can override every field listed in KPI_FIELDS without throwing", () => {
    const metrics = baseMetrics();
    const overrides: Record<string, number> = {};
    for (const field of KPI_FIELDS) overrides[field.key] = 42;
    const { metrics: result, overriddenKeys } = applyKpiOverrides(metrics, overrides);
    expect(overriddenKeys.size).toBe(KPI_FIELDS.length);
    for (const field of KPI_FIELDS) expect(field.get(result)).toBe(42);
  });

  it("groups cover every field with no field left out of a group", () => {
    const grouped = new Set(KPI_FIELDS.map((f) => f.group));
    expect(grouped.size).toBe(KPI_FIELD_GROUPS.length);
    for (const group of KPI_FIELD_GROUPS) expect(grouped.has(group)).toBe(true);
  });
});
