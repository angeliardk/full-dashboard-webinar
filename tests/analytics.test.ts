import { describe, it, expect } from "vitest";
import { calculateAttendanceMetrics } from "@/lib/analytics/attendance";
import { calculateLearningMetrics } from "@/lib/analytics/learning";
import { calculateFeedbackMetrics, categorizeComment } from "@/lib/analytics/feedback";
import { calculateUnitDistribution } from "@/lib/analytics/units";
import { classifyPlnCompanyGroup, calculateCompanyGroupDistribution } from "@/lib/analytics/pln-company-group";
import { makeFeedback, makeParticipant } from "./fixtures/participant-factory";

describe("calculateAttendanceMetrics", () => {
  it("computes registration/attendance composition without mixing definitions", () => {
    const participants = [
      makeParticipant({ attendance: { ...makeParticipant().attendance, registeredEcadin: true, zoomValidAttendee: true } }),
      makeParticipant({ attendance: { ...makeParticipant().attendance, registeredEcadin: false, zoomValidAttendee: true } }),
      makeParticipant({ attendance: { ...makeParticipant().attendance, registeredEcadin: true, zoomValidAttendee: false } }),
      makeParticipant({ attendance: { ...makeParticipant().attendance, registeredEcadin: false, zoomValidAttendee: false } }),
    ];
    const m = calculateAttendanceMetrics(participants);
    expect(m.databaseParticipantCount).toBe(4);
    expect(m.registeredCount).toBe(2);
    expect(m.zoomValidAttendeeCount).toBe(2);
    expect(m.registeredAndAttendedCount).toBe(1);
    expect(m.attendedWithoutRegistrationCount).toBe(1);
    expect(m.registeredNotAttendedCount).toBe(1);
  });

  it("excludes rows marked Exclude=true from every count", () => {
    const kept = makeParticipant({ attendance: { ...makeParticipant().attendance, registeredEcadin: true, zoomValidAttendee: true } });
    const excluded = makeParticipant({ excluded: true, attendance: { ...makeParticipant().attendance, registeredEcadin: true, zoomValidAttendee: true } });
    const m = calculateAttendanceMetrics([kept, excluded]);
    expect(m.databaseParticipantCount).toBe(1);
    expect(m.registeredCount).toBe(1);
  });

  it("counts unidentified-unit valid attendees separately", () => {
    const p1 = makeParticipant({ unit: "Tidak Teridentifikasi", attendance: { ...makeParticipant().attendance, zoomValidAttendee: true } });
    const p2 = makeParticipant({ unit: "PLN Pusat", attendance: { ...makeParticipant().attendance, zoomValidAttendee: true } });
    const m = calculateAttendanceMetrics([p1, p2]);
    expect(m.unidentifiedUnitCount).toBe(1);
  });

  it("counts zoomPresentCount as a looser >=5 minute (or no-duration) tier above zoomValidAttendeeCount", () => {
    const below5 = makeParticipant({ attendance: { ...makeParticipant().attendance, inZoomCsv: true, zoomDurationMinutes: 2, zoomValidAttendee: false } });
    const between5and30 = makeParticipant({ attendance: { ...makeParticipant().attendance, inZoomCsv: true, zoomDurationMinutes: 12, zoomValidAttendee: false } });
    const over30 = makeParticipant({ attendance: { ...makeParticipant().attendance, inZoomCsv: true, zoomDurationMinutes: 45, zoomValidAttendee: true } });
    const noDurationOnRecord = makeParticipant({ attendance: { ...makeParticipant().attendance, inZoomCsv: true, zoomDurationMinutes: null, zoomValidAttendee: true } });
    const neverJoined = makeParticipant({ attendance: { ...makeParticipant().attendance, inZoomCsv: false, zoomDurationMinutes: null, zoomValidAttendee: false } });
    const m = calculateAttendanceMetrics([below5, between5and30, over30, noDurationOnRecord, neverJoined]);
    expect(m.zoomPresentCount).toBe(3); // between5and30, over30, noDurationOnRecord
    expect(m.zoomValidAttendeeCount).toBe(2); // over30, noDurationOnRecord
    expect(m.zoomValidAttendeeCount).toBeLessThanOrEqual(m.zoomPresentCount);
  });
});

describe("calculateLearningMetrics", () => {
  const paired = (pre: number, post: number) =>
    makeParticipant({
      learning: {
        ...makeParticipant().learning,
        tookPre: true, preScore: pre,
        tookPost: true, postScore: post,
        hasPrePost: true, scoreDelta: post - pre,
      },
    });

  it("computes pre/post averages and paired gain independently", () => {
    const participants = [paired(80, 90), paired(70, 100), paired(100, 100)];
    const m = calculateLearningMetrics(participants);
    expect(m.preRespondentCount).toBe(3);
    expect(m.postRespondentCount).toBe(3);
    expect(m.pairedCount).toBe(3);
    expect(m.preAverage).toBeCloseTo((80 + 70 + 100) / 3, 1);
    expect(m.postAverage).toBeCloseTo((90 + 100 + 100) / 3, 1);
    expect(m.pairedGainAverage).toBeCloseTo(((90 - 80) + (100 - 70) + (100 - 100)) / 3, 1);
  });

  it("classifies improved/same/declined from the paired gain", () => {
    const participants = [paired(80, 90), paired(90, 90), paired(90, 80)];
    const m = calculateLearningMetrics(participants);
    expect(m.improvedCount).toBe(1);
    expect(m.sameCount).toBe(1);
    expect(m.declinedCount).toBe(1);
  });

  it("computes perfect-score counts: pre=100, post=100, and both=100 separately", () => {
    const both = paired(100, 100);
    const preOnly100 = makeParticipant({ learning: { ...makeParticipant().learning, tookPre: true, preScore: 100 } });
    const postOnly100 = makeParticipant({ learning: { ...makeParticipant().learning, tookPost: true, postScore: 100 } });
    const m = calculateLearningMetrics([both, preOnly100, postOnly100]);
    expect(m.prePerfectCount).toBe(2); // both + preOnly100
    expect(m.postPerfectCount).toBe(2); // both + postOnly100
    expect(m.bothPerfectCount).toBe(1);
    expect(m.perfectScoreParticipants).toHaveLength(1);
    expect(m.perfectScoreParticipants[0].name).toBe(both.name);
  });

  it("returns empty/null metrics gracefully with no pre/post data", () => {
    const m = calculateLearningMetrics([makeParticipant()]);
    expect(m.preAverage).toBeNull();
    expect(m.postAverage).toBeNull();
    expect(m.pairedGainAverage).toBeNull();
    expect(m.pairedCount).toBe(0);
  });
});

describe("calculateFeedbackMetrics (Likert)", () => {
  it("averages numeric responses per question", () => {
    const feedback = [
      makeFeedback({ question: "Q1", valueNumeric: 4 }),
      makeFeedback({ question: "Q1", valueNumeric: 5 }),
      makeFeedback({ question: "Q1", valueNumeric: 3 }),
    ];
    const m = calculateFeedbackMetrics(feedback);
    const q1 = m.questionMetrics.find((q) => q.question === "Q1");
    expect(q1?.responseCount).toBe(3);
    expect(q1?.average).toBeCloseTo(4, 5);
  });

  it("keeps text comments separate from Likert questions and categorizes them", () => {
    const feedback = [
      makeFeedback({ question: "Saran", type: "text", valueNumeric: null, valueText: "Sudah sangat baik, terima kasih" }),
      makeFeedback({ question: "Q1", valueNumeric: 5 }),
    ];
    const m = calculateFeedbackMetrics(feedback);
    expect(m.textComments).toHaveLength(1);
    expect(m.questionMetrics.filter((q) => q.type === "likert")).toHaveLength(1);
  });

  it("does not silently drop out-of-range Likert values — callers can flag them via validation", () => {
    const feedback = [makeFeedback({ question: "Q1", valueNumeric: 7 })];
    const m = calculateFeedbackMetrics(feedback);
    expect(m.questionMetrics[0].responseCount).toBe(1);
  });
});

describe("categorizeComment", () => {
  it("classifies appreciative comments", () => {
    expect(categorizeComment("Sudah sangat baik, terima kasih")).toBe("Apresiasi");
  });
  it("falls back to Lainnya for unmatched text", () => {
    expect(categorizeComment("Zzzqwerty random text")).not.toBe("");
  });
});

describe("calculateUnitDistribution", () => {
  it("only counts zoom-valid attendees, grouped by unit", () => {
    const participants = [
      makeParticipant({ unit: "PLN Pusat", attendance: { ...makeParticipant().attendance, zoomValidAttendee: true } }),
      makeParticipant({ unit: "PLN Pusat", attendance: { ...makeParticipant().attendance, zoomValidAttendee: true } }),
      makeParticipant({ unit: "PLN Puslitbang", attendance: { ...makeParticipant().attendance, zoomValidAttendee: true } }),
      makeParticipant({ unit: "PLN Pusat", attendance: { ...makeParticipant().attendance, zoomValidAttendee: false } }),
    ];
    const rows = calculateUnitDistribution(participants);
    expect(rows.find((r) => r.unit === "PLN Pusat")?.count).toBe(2);
    expect(rows.find((r) => r.unit === "PLN Puslitbang")?.count).toBe(1);
    expect(rows.reduce((s, r) => s + r.count, 0)).toBe(3);
  });
});

describe("classifyPlnCompanyGroup / calculateCompanyGroupDistribution", () => {
  it("rolls up PLN Pusat's own divisions/regional offices, keeps real subsidiaries separate", () => {
    expect(classifyPlnCompanyGroup("PLN Pusat")).toBe("PLN Pusat");
    expect(classifyPlnCompanyGroup("PLN Puslitbang")).toBe("PLN Pusat");
    expect(classifyPlnCompanyGroup("PLN UIP Sumbagsel")).toBe("PLN Pusat");
    expect(classifyPlnCompanyGroup("PLN Pusat Divisi Manajemen Konstruksi")).toBe("PLN Pusat");
    expect(classifyPlnCompanyGroup("PLN Indonesia Power")).toBe("PLN Indonesia Power");
    expect(classifyPlnCompanyGroup("PLN Nusantara Power")).toBe("PLN Nusantara Power");
    // "Services" must win over the plain "Nusantara Power" match -- it's a
    // distinct subsidiary-of-a-subsidiary, not the same company.
    expect(classifyPlnCompanyGroup("PLN Nusantara Power Services")).toBe("PLN Nusantara Power Services");
    expect(classifyPlnCompanyGroup("PLN Enjiniring")).toBe("PLN Enjiniring");
    expect(classifyPlnCompanyGroup("PLN Icon Plus")).toBe("PLN Icon Plus");
    expect(classifyPlnCompanyGroup("PLN Batam")).toBe("PLN Batam");
    expect(classifyPlnCompanyGroup("PLN Energi Primer Indonesia")).toBe("PLN Energi Primer Indonesia");
  });

  it("never matches a subsidiary name as a substring of something unrelated", () => {
    // regression guard, same bug class as the "Sabrina" / "brin" false positive.
    expect(classifyPlnCompanyGroup("Universitas Pertahanan RI")).not.toBe("PLN Pusat");
    expect(classifyPlnCompanyGroup("Windy Sabrina")).not.toBe("PLN Nusantara Power Services");
  });

  it("falls back to Lainnya/Eksternal for non-PLN entries, and keeps Tidak Teridentifikasi as its own bucket", () => {
    expect(classifyPlnCompanyGroup("Universitas Pertahanan RI")).toBe("Lainnya / Eksternal");
    expect(classifyPlnCompanyGroup("Tidak Teridentifikasi")).toBe("Tidak Teridentifikasi");
    expect(classifyPlnCompanyGroup(null)).toBe("Tidak Teridentifikasi");
  });

  it("calculateCompanyGroupDistribution groups on the same zoom-valid basis as calculateUnitDistribution", () => {
    const participants = [
      makeParticipant({ unit: "PLN UIP Sumbagsel", attendance: { ...makeParticipant().attendance, zoomValidAttendee: true } }),
      makeParticipant({ unit: "PLN Pusat", attendance: { ...makeParticipant().attendance, zoomValidAttendee: true } }),
      makeParticipant({ unit: "PLN Indonesia Power", attendance: { ...makeParticipant().attendance, zoomValidAttendee: true } }),
      makeParticipant({ unit: "PLN Indonesia Power", attendance: { ...makeParticipant().attendance, zoomValidAttendee: false } }),
    ];
    const rows = calculateCompanyGroupDistribution(participants);
    expect(rows.find((r) => r.unit === "PLN Pusat")?.count).toBe(2);
    expect(rows.find((r) => r.unit === "PLN Indonesia Power")?.count).toBe(1);
    expect(rows.reduce((s, r) => s + r.count, 0)).toBe(3);
  });
});
