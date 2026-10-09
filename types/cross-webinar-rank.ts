/**
 * "Summary Rank" — who shows up across the whole Webinar 1-N series, not
 * just one of them. Person-identity here is NOT the per-webinar
 * identityKey (that's deliberately scrubbed of anything reversible before
 * a seed is committed) -- it's Participant.crossWebinarKey, a one-way hash
 * of a resolved email, backfilled once per seed from raw attendance/quiz
 * exports that still had email in them. A participant with no resolvable
 * email (crossWebinarKey: null) simply can't appear in any ranking here;
 * most of Webinar 1 & 2's roster falls into that bucket since much of it
 * was reconstructed from old aggregate counts with no individual identity
 * to begin with, not from a mapping bug.
 */

export interface RankedWebinarRef {
  webinarId: string;
  webinarNumber: number;
  webinarTitle: string;
}

export interface ConsistencyRankEntry {
  crossWebinarKey: string;
  name: string;
  unit: string;
  attendedCount: number;
  totalDurationMinutes: number;
  webinars: RankedWebinarRef[];
}

export interface ScoreRankEntry {
  crossWebinarKey: string;
  name: string;
  unit: string;
  averageScore: number;
  participations: number;
  scores: (RankedWebinarRef & { score: number })[];
}

export interface AskerRankEntry {
  /** Best-effort name match only -- Zoom chat questions carry no participant link at all. */
  name: string;
  totalQuestions: number;
  webinars: RankedWebinarRef[];
}

export interface HeroAwarenessEntry {
  crossWebinarKey: string;
  name: string;
  unit: string;
  attendedCount: number;
  totalWebinars: number;
  averagePostScore: number | null;
  questionsAsked: number;
  feedbackCount: number;
  /** 0-100, see calculateHeroAwareness for the weighted formula. */
  score: number;
  breakdown: { attendance: number; quiz: number; engagement: number };
  webinars: RankedWebinarRef[];
}

export interface CrossWebinarRankMetrics {
  totalWebinars: number;
  /** How many distinct people have a crossWebinarKey at all (the pool these rankings draw from). */
  identifiablePeopleCount: number;
  consistency: ConsistencyRankEntry[];
  topPreTest: ScoreRankEntry[];
  topPostTest: ScoreRankEntry[];
  topAskers: AskerRankEntry[];
  heroAwareness: HeroAwarenessEntry[];
}
