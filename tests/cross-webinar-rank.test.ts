import { describe, it, expect } from "vitest";
import {
  calculateConsistencyRanking,
  calculateTopPreTestRanking,
  calculateTopPostTestRanking,
  calculateTopAskers,
  calculateHeroAwareness,
  calculateCrossWebinarRankMetrics,
  calculatePrizeWinnersByWebinar,
} from "@/lib/analytics/cross-webinar-rank";
import { makeParticipant, makeWebinar } from "./fixtures/participant-factory";
import webinar1 from "@/lib/migration/seed/webinar-1.json";
import webinar2 from "@/lib/migration/seed/webinar-2.json";
import webinar3 from "@/lib/migration/seed/webinar-3.json";
import webinar4 from "@/lib/migration/seed/webinar-4.json";
import webinar5 from "@/lib/migration/seed/webinar-5.json";
import type { Webinar } from "@/types/webinar";

const KEY_A = "p_hash_a";
const KEY_B = "p_hash_b";

function attendee(key: string, name: string, overrides: Parameters<typeof makeParticipant>[0] = {}) {
  return makeParticipant({
    crossWebinarKey: key,
    name,
    attendance: { ...makeParticipant().attendance, zoomValidAttendee: true, zoomDurationMinutes: 45 },
    ...overrides,
  });
}

describe("calculateConsistencyRanking", () => {
  it("counts distinct webinars attended per crossWebinarKey, ignores participants with no key", () => {
    const w1 = makeWebinar({ number: 1, participants: [attendee(KEY_A, "Budi"), attendee(KEY_B, "Siti")] });
    const w2 = makeWebinar({ number: 2, participants: [attendee(KEY_A, "Budi"), makeParticipant({ crossWebinarKey: null, name: "Tanpa Email" })] });
    const result = calculateConsistencyRanking([w1, w2]);
    const budi = result.find((r) => r.crossWebinarKey === KEY_A);
    const siti = result.find((r) => r.crossWebinarKey === KEY_B);
    expect(budi?.attendedCount).toBe(2);
    expect(siti?.attendedCount).toBe(1);
    expect(result.find((r) => r.name === "Tanpa Email")).toBeUndefined();
  });

  it("excludes participants marked excluded in that webinar from counting as attended there", () => {
    const w1 = makeWebinar({ number: 1, participants: [attendee(KEY_A, "Budi", { excluded: true, exclusionReason: "Panitia" })] });
    const result = calculateConsistencyRanking([w1]);
    expect(result.find((r) => r.crossWebinarKey === KEY_A)).toBeUndefined();
  });
});

describe("calculateTopPreTestRanking / calculateTopPostTestRanking", () => {
  it("requires the minimum participation count before a person qualifies", () => {
    const w1 = makeWebinar({
      number: 1,
      participants: [attendee(KEY_A, "Budi", { learning: { ...makeParticipant().learning, tookPre: true, preScore: 100 } })],
    });
    const onlyOne = calculateTopPreTestRanking([w1], 10, 2);
    expect(onlyOne).toHaveLength(0);
    const relaxed = calculateTopPreTestRanking([w1], 10, 1);
    expect(relaxed).toHaveLength(1);
  });

  it("averages the score across qualifying webinars, not just the latest one", () => {
    const w1 = makeWebinar({ number: 1, participants: [attendee(KEY_A, "Budi", { learning: { ...makeParticipant().learning, tookPost: true, postScore: 80 } })] });
    const w2 = makeWebinar({ number: 2, participants: [attendee(KEY_A, "Budi", { learning: { ...makeParticipant().learning, tookPost: true, postScore: 100 } })] });
    const result = calculateTopPostTestRanking([w1, w2], 10, 2);
    expect(result[0].averageScore).toBe(90);
    expect(result[0].participations).toBe(2);
  });
});

describe("calculateTopAskers", () => {
  it("matches purely on normalized asker name, independent of crossWebinarKey", () => {
    const w1 = makeWebinar({ number: 1, questions: [{ id: "q1", time: "10:00", askerName: "Budi Santoso", unit: null, question: "A?" }] });
    const w2 = makeWebinar({ number: 2, questions: [{ id: "q2", time: "11:00", askerName: "  budi   santoso ", unit: null, question: "B?" }] });
    const result = calculateTopAskers([w1, w2]);
    expect(result[0].name).toBe("Budi Santoso");
    expect(result[0].totalQuestions).toBe(2);
    expect(result[0].webinars).toHaveLength(2);
  });
});

describe("calculateHeroAwareness", () => {
  it("scales the attendance component linearly with how many (of all) webinars were attended", () => {
    const w1 = makeWebinar({ number: 1, participants: [attendee(KEY_A, "Hadir Selalu"), attendee(KEY_B, "Hadir Sekali")] });
    const w2 = makeWebinar({ number: 2, participants: [attendee(KEY_A, "Hadir Selalu")] });
    const result = calculateHeroAwareness([w1, w2], 5);
    const full = result.find((r) => r.crossWebinarKey === KEY_A)!;
    const half = result.find((r) => r.crossWebinarKey === KEY_B)!;
    expect(full.attendedCount).toBe(2);
    expect(half.attendedCount).toBe(1);
    expect(full.breakdown.attendance).toBeCloseTo(half.breakdown.attendance * 2, 1);
    expect(full.breakdown.attendance + full.breakdown.quiz + full.breakdown.engagement).toBeCloseTo(full.score, 1);
  });

  it("scales the quiz component with average post-test score, 0 when nobody took it", () => {
    const w1 = makeWebinar({
      number: 1,
      participants: [
        attendee(KEY_A, "Nilai Sempurna", { learning: { ...makeParticipant().learning, tookPost: true, postScore: 100 } }),
        attendee(KEY_B, "Tidak Ikut Kuis"),
      ],
    });
    const result = calculateHeroAwareness([w1], 5);
    const perfect = result.find((r) => r.crossWebinarKey === KEY_A)!;
    const noQuiz = result.find((r) => r.crossWebinarKey === KEY_B)!;
    expect(perfect.averagePostScore).toBe(100);
    expect(perfect.breakdown.quiz).toBeGreaterThan(0);
    expect(noQuiz.averagePostScore).toBeNull();
    expect(noQuiz.breakdown.quiz).toBe(0);
  });

  it("caps the engagement component so it can never exceed its weight share, however many questions are asked", () => {
    const w1 = makeWebinar({
      number: 1,
      participants: [attendee(KEY_A, "Rajin Tanya")],
      questions: Array.from({ length: 20 }, (_, i) => ({ id: `q${i}`, time: null, askerName: "Rajin Tanya", unit: null, question: "?" })),
    });
    const result = calculateHeroAwareness([w1], 5);
    const entry = result.find((r) => r.crossWebinarKey === KEY_A)!;
    expect(entry.questionsAsked).toBe(20);
    expect(entry.breakdown.engagement).toBeLessThanOrEqual(25); // HERO_WEIGHT_ENGAGEMENT
  });
});

describe("calculateCrossWebinarRankMetrics against the real committed seeds", () => {
  it("produces plausible top-of-list results for multi-webinar attendees (sanity check, not exact numbers)", () => {
    const webinars = [webinar1, webinar2, webinar3, webinar4, webinar5].map((w) => w as unknown as Webinar);
    const result = calculateCrossWebinarRankMetrics(webinars);
    expect(result.totalWebinars).toBe(5);
    expect(result.identifiablePeopleCount).toBeGreaterThan(500);
    expect(result.consistency.length).toBeGreaterThan(0);
    expect(result.consistency[0].attendedCount).toBeGreaterThanOrEqual(3);
    // nobody attended all 5 at the time this was written (mostly a Webinar-1/2
    // identity-matching ceiling, not a bug) -- this guards against a future
    // regression silently inflating counts past what the data supports.
    expect(result.consistency[0].attendedCount).toBeLessThanOrEqual(5);
    expect(result.heroAwareness).toHaveLength(5);
    for (const h of result.heroAwareness) {
      expect(h.score).toBeGreaterThanOrEqual(0);
      expect(h.score).toBeLessThanOrEqual(100);
    }
  });

  it("never lets two different active participants in the same webinar share a crossWebinarKey", () => {
    // Regression guard: the name-only backfill pass that assigns crossWebinarKey
    // once collapsed two different real people both named "Agung Putra" (different
    // units, different ids) in Webinar 4 into one key, which would have silently
    // merged two distinct people into a single cross-webinar ranking entry. The
    // backfill now nulls out any key that collides within a single webinar instead
    // of guessing -- this asserts that invariant holds for every committed seed.
    for (const raw of [webinar1, webinar2, webinar3, webinar4, webinar5]) {
      const w = raw as unknown as Webinar;
      const seen = new Map<string, string>();
      for (const p of w.participants) {
        if (p.excluded || !p.crossWebinarKey) continue;
        const prior = seen.get(p.crossWebinarKey);
        expect(prior, `${w.id}: crossWebinarKey ${p.crossWebinarKey} used by both "${prior}" and "${p.name}"`).toBeUndefined();
        seen.set(p.crossWebinarKey, p.name);
      }
    }
  });
});

function perfectScorer(key: string | null, name: string, postTimestamp: string, overrides: Parameters<typeof makeParticipant>[0] = {}) {
  return makeParticipant({
    crossWebinarKey: key,
    name,
    learning: {
      tookPre: true, preTimestamp: null, preCorrect: null, preWrong: null, preScore: 100, preAnswers: null,
      tookPost: true, postTimestamp, postCorrect: null, postWrong: null, postScore: 100, postAnswers: null,
      scoreDelta: 0, scoreChangeStatus: null, hasPrePost: true,
    },
    ...overrides,
  });
}

describe("calculatePrizeWinnersByWebinar", () => {
  it("skips someone who already won a voucher in an earlier webinar (by number, not array order)", () => {
    const w2 = makeWebinar({
      number: 2,
      participants: [perfectScorer(KEY_A, "Budi", "2026-02-01T09:00:00Z"), perfectScorer(KEY_B, "Siti", "2026-02-01T09:05:00Z")],
    });
    const w1 = makeWebinar({
      number: 1,
      participants: [perfectScorer(KEY_A, "Budi", "2026-01-01T09:00:00Z")],
    });
    // passed out of number order on purpose -- the function must sort by webinar.number itself.
    const result = calculatePrizeWinnersByWebinar([w2, w1], 1);
    expect(result.get(w1.id)?.map((p) => p.name)).toEqual(["Budi"]);
    // Budi already won in webinar 1, so webinar 2's limit-1 winner is Siti, not Budi again.
    expect(result.get(w2.id)?.map((p) => p.name)).toEqual(["Siti"]);
  });

  it("never excludes someone with no resolvable crossWebinarKey, even across webinars with the same name", () => {
    const w1 = makeWebinar({ number: 1, participants: [perfectScorer(null, "Nama Umum", "2026-01-01T09:00:00Z")] });
    const w2 = makeWebinar({ number: 2, participants: [perfectScorer(null, "Nama Umum", "2026-02-01T09:00:00Z")] });
    const result = calculatePrizeWinnersByWebinar([w1, w2]);
    expect(result.get(w1.id)).toHaveLength(1);
    expect(result.get(w2.id)).toHaveLength(1);
  });

  it("still respects the limit and the fastest-post-test ordering within a single webinar", () => {
    const w1 = makeWebinar({
      number: 1,
      participants: [
        perfectScorer("k1", "C", "2026-01-01T10:00:00Z"),
        perfectScorer("k2", "A", "2026-01-01T08:00:00Z"),
        perfectScorer("k3", "B", "2026-01-01T09:00:00Z"),
      ],
    });
    const result = calculatePrizeWinnersByWebinar([w1], 2);
    expect(result.get(w1.id)?.map((p) => p.name)).toEqual(["A", "B"]);
  });
});
