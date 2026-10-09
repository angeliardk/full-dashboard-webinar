import type { Webinar } from "@/types/webinar";
import type {
  AskerRankEntry,
  ConsistencyRankEntry,
  CrossWebinarRankMetrics,
  HeroAwarenessEntry,
  RankedWebinarRef,
  ScoreRankEntry,
} from "@/types/cross-webinar-rank";
import { activeParticipants, round2 } from "./helpers";

function webinarRef(w: Webinar): RankedWebinarRef {
  return { webinarId: w.id, webinarNumber: w.number, webinarTitle: w.metadata.title };
}

function normalizeName(n: string): string {
  return n.trim().toLowerCase().replace(/\s+/g, " ");
}

interface PersonAgg {
  crossWebinarKey: string;
  nameCounts: Map<string, number>;
  unitCounts: Map<string, number>;
  attended: { ref: RankedWebinarRef; durationMinutes: number }[];
  preScores: { ref: RankedWebinarRef; score: number }[];
  postScores: { ref: RankedWebinarRef; score: number }[];
  feedbackCount: number;
}

function pickMostCommon(counts: Map<string, number>): string {
  let best = "";
  let bestCount = -1;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

/**
 * One pass over every webinar's active (non-excluded) participants, grouped
 * by crossWebinarKey. Participants without a resolvable key (most of
 * Webinar 1 & 2's reconstructed roster, plus anyone whose email just
 * wasn't in the source exports used to backfill the key) are skipped
 * entirely here -- there's no reliable way to place them across webinars.
 */
function buildPersonIndex(webinars: Webinar[]): Map<string, PersonAgg> {
  const index = new Map<string, PersonAgg>();

  for (const w of webinars) {
    const ref = webinarRef(w);
    for (const p of activeParticipants(w.participants)) {
      if (!p.crossWebinarKey) continue;
      let agg = index.get(p.crossWebinarKey);
      if (!agg) {
        agg = {
          crossWebinarKey: p.crossWebinarKey,
          nameCounts: new Map(),
          unitCounts: new Map(),
          attended: [],
          preScores: [],
          postScores: [],
          feedbackCount: 0,
        };
        index.set(p.crossWebinarKey, agg);
      }
      agg.nameCounts.set(p.name, (agg.nameCounts.get(p.name) ?? 0) + 1);
      agg.unitCounts.set(p.unitFinal, (agg.unitCounts.get(p.unitFinal) ?? 0) + 1);
      if (p.attendance.zoomValidAttendee) {
        agg.attended.push({ ref, durationMinutes: p.attendance.zoomDurationMinutes ?? 0 });
      }
      if (p.learning.tookPre && p.learning.preScore != null) {
        agg.preScores.push({ ref, score: p.learning.preScore });
      }
      if (p.learning.tookPost && p.learning.postScore != null) {
        agg.postScores.push({ ref, score: p.learning.postScore });
      }
      if (p.feedbackSubmitted) agg.feedbackCount++;
    }
  }

  return index;
}

export function calculateConsistencyRanking(webinars: Webinar[], limit = 10): ConsistencyRankEntry[] {
  const index = buildPersonIndex(webinars);
  const entries: ConsistencyRankEntry[] = [...index.values()]
    .filter((p) => p.attended.length > 0)
    .map((p) => ({
      crossWebinarKey: p.crossWebinarKey,
      name: pickMostCommon(p.nameCounts),
      unit: pickMostCommon(p.unitCounts),
      attendedCount: p.attended.length,
      totalDurationMinutes: p.attended.reduce((s, a) => s + a.durationMinutes, 0),
      webinars: p.attended.map((a) => a.ref),
    }));
  return entries
    .sort((a, b) => b.attendedCount - a.attendedCount || b.totalDurationMinutes - a.totalDurationMinutes)
    .slice(0, limit);
}

function calculateScoreRanking(
  webinars: Webinar[],
  field: "preScores" | "postScores",
  limit: number,
  minParticipations: number,
): ScoreRankEntry[] {
  const index = buildPersonIndex(webinars);
  const entries: ScoreRankEntry[] = [...index.values()]
    .filter((p) => p[field].length >= minParticipations)
    .map((p) => {
      const scores = p[field];
      const average = round2(scores.reduce((s, x) => s + x.score, 0) / scores.length);
      return {
        crossWebinarKey: p.crossWebinarKey,
        name: pickMostCommon(p.nameCounts),
        unit: pickMostCommon(p.unitCounts),
        averageScore: average,
        participations: scores.length,
        scores: scores.map((x) => ({ ...x.ref, score: x.score })),
      };
    });
  return entries
    .sort((a, b) => b.averageScore - a.averageScore || b.participations - a.participations)
    .slice(0, limit);
}

export function calculateTopPreTestRanking(webinars: Webinar[], limit = 10, minParticipations = 2): ScoreRankEntry[] {
  return calculateScoreRanking(webinars, "preScores", limit, minParticipations);
}

export function calculateTopPostTestRanking(webinars: Webinar[], limit = 10, minParticipations = 2): ScoreRankEntry[] {
  return calculateScoreRanking(webinars, "postScores", limit, minParticipations);
}

/**
 * Zoom-chat questions carry only free-typed asker names, never a
 * participant link -- so this is name-matched only, independent of
 * crossWebinarKey, and looser than every other ranking here.
 */
export function calculateTopAskers(webinars: Webinar[], limit = 10): AskerRankEntry[] {
  const byName = new Map<string, { displayName: string; count: number; webinars: Map<string, RankedWebinarRef> }>();
  for (const w of webinars) {
    const ref = webinarRef(w);
    for (const q of w.questions) {
      const nm = q.askerName?.trim();
      if (!nm) continue;
      const key = normalizeName(nm);
      let entry = byName.get(key);
      if (!entry) {
        entry = { displayName: nm, count: 0, webinars: new Map() };
        byName.set(key, entry);
      }
      entry.count++;
      entry.webinars.set(ref.webinarId, ref);
    }
  }
  return [...byName.values()]
    .map((e) => ({ name: e.displayName, totalQuestions: e.count, webinars: [...e.webinars.values()] }))
    .sort((a, b) => b.totalQuestions - a.totalQuestions)
    .slice(0, limit);
}

// Hero Awareness weights -- out of 100 points total. Attendance counts for
// the most (showing up repeatedly is the hardest thing to fake), quiz
// quality next, engagement (asking questions / leaving feedback) last.
const HERO_WEIGHT_ATTENDANCE = 40;
const HERO_WEIGHT_QUIZ = 35;
const HERO_WEIGHT_ENGAGEMENT = 25;
const HERO_QUESTIONS_CAP = 3; // questions beyond this don't add more engagement points

export function calculateHeroAwareness(webinars: Webinar[], limit = 5): HeroAwarenessEntry[] {
  const index = buildPersonIndex(webinars);
  const askerCounts = new Map<string, number>();
  for (const e of calculateTopAskers(webinars, Infinity)) {
    askerCounts.set(normalizeName(e.name), e.totalQuestions);
  }
  const totalWebinars = webinars.length;

  const entries: HeroAwarenessEntry[] = [...index.values()]
    .filter((p) => p.attended.length > 0)
    .map((p) => {
      const name = pickMostCommon(p.nameCounts);
      const questionsAsked = askerCounts.get(normalizeName(name)) ?? 0;
      const avgPost = p.postScores.length ? round2(p.postScores.reduce((s, x) => s + x.score, 0) / p.postScores.length) : null;

      const attendanceScore = totalWebinars > 0 ? (p.attended.length / totalWebinars) * HERO_WEIGHT_ATTENDANCE : 0;
      const quizScore = avgPost != null ? (avgPost / 100) * HERO_WEIGHT_QUIZ : 0;
      const questionPoints = (Math.min(questionsAsked, HERO_QUESTIONS_CAP) / HERO_QUESTIONS_CAP) * (HERO_WEIGHT_ENGAGEMENT * 0.6);
      const feedbackPoints = (p.feedbackCount / Math.max(p.attended.length, 1)) * (HERO_WEIGHT_ENGAGEMENT * 0.4);
      const engagementScore = Math.min(questionPoints + feedbackPoints, HERO_WEIGHT_ENGAGEMENT);

      return {
        crossWebinarKey: p.crossWebinarKey,
        name,
        unit: pickMostCommon(p.unitCounts),
        attendedCount: p.attended.length,
        totalWebinars,
        averagePostScore: avgPost,
        questionsAsked,
        feedbackCount: p.feedbackCount,
        score: round2(attendanceScore + quizScore + engagementScore),
        breakdown: { attendance: round2(attendanceScore), quiz: round2(quizScore), engagement: round2(engagementScore) },
        webinars: p.attended.map((a) => a.ref),
      };
    });

  return entries.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function calculateCrossWebinarRankMetrics(webinars: Webinar[]): CrossWebinarRankMetrics {
  const index = buildPersonIndex(webinars);
  return {
    totalWebinars: webinars.length,
    identifiablePeopleCount: index.size,
    consistency: calculateConsistencyRanking(webinars),
    topPreTest: calculateTopPreTestRanking(webinars),
    topPostTest: calculateTopPostTestRanking(webinars),
    topAskers: calculateTopAskers(webinars),
    heroAwareness: calculateHeroAwareness(webinars),
  };
}
