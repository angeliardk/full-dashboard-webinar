import type { Webinar } from "@/types/webinar";
import type { CompletionRates, WebinarMetrics } from "@/types/analytics";
import { calculateAttendanceMetrics } from "./attendance";
import { calculateLearningMetrics } from "./learning";
import { calculateFeedbackMetrics } from "./feedback";
import { calculateUnitDistribution, calculateQuestionMetrics } from "./units";
import { activeParticipants, ratio } from "./helpers";

export function calculateCompletionRates(webinar: Webinar): CompletionRates {
  const active = activeParticipants(webinar.participants);
  const attendees = active.filter((p) => p.attendance.zoomValidAttendee).length;
  const pre = active.filter((p) => p.learning.tookPre).length;
  const post = active.filter((p) => p.learning.tookPost).length;
  const fb = active.filter((p) => p.feedbackSubmitted).length;
  return {
    preRate: ratio(pre, attendees),
    postRate: ratio(post, attendees),
    feedbackRate: ratio(fb, attendees),
  };
}

export function calculateWebinarMetrics(webinar: Webinar): WebinarMetrics {
  return {
    attendance: calculateAttendanceMetrics(webinar.participants),
    learning: calculateLearningMetrics(webinar.participants),
    feedback: calculateFeedbackMetrics(webinar.feedback),
    units: calculateUnitDistribution(webinar.participants),
    questions: calculateQuestionMetrics(webinar.questions),
    completion: calculateCompletionRates(webinar),
  };
}
