import type { Webinar } from "@/types/webinar";
import type { CrossWebinarMetrics, CrossWebinarSeriesPoint, CrossWebinarUnitDistribution, WebinarMetrics } from "@/types/analytics";

function point(w: Webinar, value: number | null): CrossWebinarSeriesPoint {
  return { webinarId: w.id, webinarNumber: w.number, webinarTitle: w.metadata.title, value };
}

export interface WebinarWithMetrics {
  webinar: Webinar;
  metrics: WebinarMetrics;
}

/**
 * Takes already-resolved (metadata, metrics) pairs rather than recomputing
 * from `webinar.participants` — some webinars shown on this dashboard are
 * read-only "shells" published from another browser with no local
 * participant rows, so their real numbers only exist in `metrics`.
 */
export function calculateCrossWebinarMetrics(entries: WebinarWithMetrics[]): CrossWebinarMetrics {
  const perWebinar = [...entries].sort((a, b) => a.webinar.number - b.webinar.number);

  const unitMap = new Map<string, Record<string, number>>();
  for (const { webinar, metrics } of perWebinar) {
    for (const row of metrics.units) {
      const entry = unitMap.get(row.unit) ?? {};
      entry[webinar.id] = row.count;
      unitMap.set(row.unit, entry);
    }
  }
  const unitDistribution: CrossWebinarUnitDistribution[] = [...unitMap.entries()]
    .map(([unit, webinarCounts]) => ({
      unit,
      webinarCounts,
      total: Object.values(webinarCounts).reduce((s, v) => s + v, 0),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    webinarCount: perWebinar.length,
    totalRegistered: perWebinar.reduce((s, x) => s + x.metrics.attendance.registeredCount, 0),
    totalZoomValidAttendees: perWebinar.reduce((s, x) => s + x.metrics.attendance.zoomValidAttendeeCount, 0),
    totalPre: perWebinar.reduce((s, x) => s + x.metrics.learning.preRespondentCount, 0),
    totalPost: perWebinar.reduce((s, x) => s + x.metrics.learning.postRespondentCount, 0),
    totalPaired: perWebinar.reduce((s, x) => s + x.metrics.learning.pairedCount, 0),
    totalFeedback: perWebinar.reduce((s, x) => s + x.metrics.feedback.distinctRespondentCount, 0),
    attendanceByWebinar: perWebinar.map((x) => point(x.webinar, x.metrics.attendance.zoomValidAttendeeCount)),
    preByWebinar: perWebinar.map((x) => point(x.webinar, x.metrics.learning.preAverage)),
    postByWebinar: perWebinar.map((x) => point(x.webinar, x.metrics.learning.postAverage)),
    gainByWebinar: perWebinar.map((x) => point(x.webinar, x.metrics.learning.pairedGainAverage)),
    preCompletionByWebinar: perWebinar.map((x) => point(x.webinar, x.metrics.completion.preRate)),
    postCompletionByWebinar: perWebinar.map((x) => point(x.webinar, x.metrics.completion.postRate)),
    feedbackCompletionByWebinar: perWebinar.map((x) => point(x.webinar, x.metrics.completion.feedbackRate)),
    feedbackAverageByWebinar: perWebinar.map((x) => {
      const avgs = x.metrics.feedback.questionMetrics
        .filter((q) => q.type === "likert" && q.average != null)
        .map((q) => q.average as number);
      const avg = avgs.length ? avgs.reduce((s, v) => s + v, 0) / avgs.length : null;
      return point(x.webinar, avg == null ? null : Math.round(avg * 100) / 100);
    }),
    unitDistribution,
  };
}
