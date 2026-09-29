import type { Participant } from "@/types/webinar";
import type { LearningMetrics, LearningPair } from "@/types/analytics";
import { activeParticipants, average, toBucketDistribution, toGainDistribution } from "./helpers";

export interface FastestPerfectScorer {
  participantId: string;
  name: string;
  unit: string;
  preTimestamp: string | null;
  postTimestamp: string | null;
  completionMinutes: number | null;
}

/**
 * Ranks participants who scored 100 on BOTH pre and post-test by earliest
 * valid post-test submission (absolute clock time) — used to identify
 * prize-eligible "fastest perfect score" winners. Ranking by each person's
 * own pre→post elapsed time was tried first, but that rewards whoever
 * happened to start the pre-test late relative to the group, which isn't a
 * fair read of "fastest" — the agreed rule is the same as a race: first
 * valid post-test submission wins, regardless of when that person started.
 * completionMinutes is still computed and returned (for display only, not
 * used to rank) when a pre-test timestamp is available.
 */
export function getFastestPerfectScorers(pairs: LearningPair[], limit = 3): FastestPerfectScorer[] {
  return pairs
    .filter((p) => p.pre === 100 && p.post === 100 && p.postTimestamp != null)
    .map((p) => {
      const post = Date.parse(p.postTimestamp as string);
      const pre = p.preTimestamp ? Date.parse(p.preTimestamp) : null;
      const completionMinutes = pre != null && !Number.isNaN(pre) && !Number.isNaN(post) ? Math.round(((post - pre) / 60000) * 10) / 10 : null;
      return {
        participantId: p.participantId,
        name: p.name,
        unit: p.unit,
        preTimestamp: p.preTimestamp,
        postTimestamp: p.postTimestamp,
        completionMinutes,
      };
    })
    .sort((a, b) => Date.parse(a.postTimestamp as string) - Date.parse(b.postTimestamp as string))
    .slice(0, limit);
}

export function calculateLearningMetrics(participants: Participant[]): LearningMetrics {
  const active = activeParticipants(participants);

  const preTakers = active.filter((p) => p.learning.tookPre && p.learning.preScore != null);
  const postTakers = active.filter((p) => p.learning.tookPost && p.learning.postScore != null);
  const paired = active.filter(
    (p) => p.learning.hasPrePost && p.learning.preScore != null && p.learning.postScore != null,
  );

  const preScores = preTakers.map((p) => p.learning.preScore as number);
  const postScores = postTakers.map((p) => p.learning.postScore as number);

  const gains = paired.map(
    (p) => p.learning.scoreDelta ?? (p.learning.postScore as number) - (p.learning.preScore as number),
  );

  let improvedCount = 0;
  let sameCount = 0;
  let declinedCount = 0;
  for (const g of gains) {
    if (g > 0) improvedCount++;
    else if (g === 0) sameCount++;
    else declinedCount++;
  }

  const prePerfect = preTakers.filter((p) => p.learning.preScore === 100);
  const postPerfect = postTakers.filter((p) => p.learning.postScore === 100);
  const bothPerfect = active.filter(
    (p) => p.learning.preScore === 100 && p.learning.postScore === 100,
  );

  return {
    preRespondentCount: preTakers.length,
    postRespondentCount: postTakers.length,
    pairedCount: paired.length,
    preAverage: average(preScores),
    postAverage: average(postScores),
    pairedGainAverage: average(gains),
    pairedPreAverage: average(paired.map((p) => p.learning.preScore as number)),
    pairedPostAverage: average(paired.map((p) => p.learning.postScore as number)),
    improvedCount,
    sameCount,
    declinedCount,
    preDistribution: toBucketDistribution(preScores),
    postDistribution: toBucketDistribution(postScores),
    gainDistribution: toGainDistribution(gains),
    prePerfectCount: prePerfect.length,
    postPerfectCount: postPerfect.length,
    bothPerfectCount: bothPerfect.length,
    perfectScoreParticipants: bothPerfect.map((p) => ({ id: p.id, name: p.name, unit: p.unitFinal })),
    preMin: preScores.length ? Math.min(...preScores) : null,
    preMax: preScores.length ? Math.max(...preScores) : null,
    postMin: postScores.length ? Math.min(...postScores) : null,
    postMax: postScores.length ? Math.max(...postScores) : null,
    pairs: paired.map((p) => ({
      participantId: p.id,
      name: p.name,
      unit: p.unitFinal,
      pre: p.learning.preScore as number,
      post: p.learning.postScore as number,
      gain: p.learning.scoreDelta ?? (p.learning.postScore as number) - (p.learning.preScore as number),
      preTimestamp: p.learning.preTimestamp,
      postTimestamp: p.learning.postTimestamp,
    })),
  };
}
