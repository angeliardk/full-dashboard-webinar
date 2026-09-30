import type { Participant, WebinarQuestion } from "@/types/webinar";
import type { QuestionActivityMetrics, UnitDistributionRow } from "@/types/analytics";
import { activeParticipants, ratio } from "./helpers";

export function calculateUnitDistribution(participants: Participant[]): UnitDistributionRow[] {
  const active = activeParticipants(participants).filter((p) => p.attendance.zoomValidAttendee);
  const counts = new Map<string, number>();
  for (const p of active) {
    const unit = p.unitFinal?.trim() || "Tidak Teridentifikasi";
    counts.set(unit, (counts.get(unit) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([unit, count]) => ({ unit, count }))
    .sort((a, b) => b.count - a.count);
}

export function calculateQuestionMetrics(questions: WebinarQuestion[], validAttendeeCount: number): QuestionActivityMetrics | null {
  if (!questions || questions.length === 0) return null;
  const askerCounts = new Map<string, { name: string; unit: string | null; count: number }>();
  for (const q of questions) {
    const name = q.askerName?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = askerCounts.get(key);
    if (existing) existing.count++;
    else askerCounts.set(key, { name, unit: q.unit ?? null, count: 1 });
  }
  return {
    questionCount: questions.length,
    askerCount: askerCounts.size,
    topAskers: [...askerCounts.values()].sort((a, b) => b.count - a.count),
    askerPercentOfAttendees: ratio(askerCounts.size, validAttendeeCount),
  };
}
