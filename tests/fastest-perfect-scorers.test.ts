import { describe, it, expect } from "vitest";
import { getFastestPerfectScorers } from "@/lib/analytics/learning";
import type { LearningPair } from "@/types/analytics";

function pair(overrides: Partial<LearningPair>): LearningPair {
  return {
    participantId: "p-1", name: "Peserta", unit: "PLN Pusat", pre: 100, post: 100, gain: 0,
    preTimestamp: null, postTimestamp: null,
    ...overrides,
  };
}

describe("getFastestPerfectScorers", () => {
  it("only ranks participants who scored 100 on both pre and post", () => {
    const pairs = [
      pair({ participantId: "a", pre: 100, post: 100, postTimestamp: "2026-01-01T10:00:00Z" }),
      pair({ participantId: "b", pre: 90, post: 100, postTimestamp: "2026-01-01T09:00:00Z" }),
      pair({ participantId: "c", pre: 100, post: 90, postTimestamp: "2026-01-01T09:30:00Z" }),
    ];
    const result = getFastestPerfectScorers(pairs);
    expect(result).toHaveLength(1);
    expect(result[0].participantId).toBe("a");
  });

  it("sorts by earliest post-test submission first", () => {
    const pairs = [
      pair({ participantId: "a", postTimestamp: "2026-01-01T10:00:00Z" }),
      pair({ participantId: "b", postTimestamp: "2026-01-01T08:00:00Z" }),
      pair({ participantId: "c", postTimestamp: "2026-01-01T09:00:00Z" }),
    ];
    const result = getFastestPerfectScorers(pairs);
    expect(result.map((p) => p.participantId)).toEqual(["b", "c", "a"]);
  });

  it("respects the limit parameter", () => {
    const pairs = Array.from({ length: 5 }, (_, i) =>
      pair({ participantId: `p-${i}`, postTimestamp: `2026-01-01T0${i}:00:00Z` }),
    );
    expect(getFastestPerfectScorers(pairs, 3)).toHaveLength(3);
  });

  it("computes completion minutes from pre to post timestamp when both are available", () => {
    const pairs = [pair({ participantId: "a", preTimestamp: "2026-01-01T10:00:00Z", postTimestamp: "2026-01-01T10:15:00Z" })];
    const result = getFastestPerfectScorers(pairs);
    expect(result[0].completionMinutes).toBe(15);
  });

  it("excludes perfect scorers with no post-test timestamp rather than guessing an order", () => {
    const pairs = [pair({ participantId: "a", postTimestamp: null })];
    expect(getFastestPerfectScorers(pairs)).toHaveLength(0);
  });

  it("ranks by earliest absolute post-test submission, not by shortest personal completion time", () => {
    const pairs = [
      // "a" submitted earliest in absolute time, despite taking the longest personally (started way earlier).
      pair({ participantId: "a", preTimestamp: "2026-01-01T08:00:00Z", postTimestamp: "2026-01-01T10:00:00Z" }),
      // "b" was personally the fastest, but submitted later in absolute time — still ranked second.
      pair({ participantId: "b", preTimestamp: "2026-01-01T09:50:00Z", postTimestamp: "2026-01-01T10:05:00Z" }),
    ];
    const result = getFastestPerfectScorers(pairs);
    expect(result[0].participantId).toBe("a");
    expect(result[0].completionMinutes).toBe(120);
    expect(result[1].participantId).toBe("b");
    expect(result[1].completionMinutes).toBe(15);
  });

  it("ranks purely by post-test timestamp even when some entries have no pre-test timestamp at all", () => {
    const pairs = [
      pair({ participantId: "no-pre-but-later", preTimestamp: null, postTimestamp: "2026-01-01T09:00:00Z" }),
      pair({ participantId: "has-pre-but-earlier", preTimestamp: "2026-01-01T11:00:00Z", postTimestamp: "2026-01-01T08:30:00Z" }),
    ];
    const result = getFastestPerfectScorers(pairs);
    expect(result[0].participantId).toBe("has-pre-but-earlier");
    expect(result[1].participantId).toBe("no-pre-but-later");
  });
});
