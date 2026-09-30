export interface ScoreDistributionBucket {
  bucket: number;
  count: number;
}

export interface LearningPair {
  participantId: string;
  name: string;
  unit: string;
  pre: number;
  post: number;
  gain: number;
  preTimestamp: string | null;
  postTimestamp: string | null;
}

export interface LearningMetrics {
  preRespondentCount: number;
  postRespondentCount: number;
  pairedCount: number;
  preAverage: number | null;
  postAverage: number | null;
  pairedGainAverage: number | null;
  pairedPreAverage: number | null;
  pairedPostAverage: number | null;
  improvedCount: number;
  sameCount: number;
  declinedCount: number;
  preDistribution: ScoreDistributionBucket[];
  postDistribution: ScoreDistributionBucket[];
  gainDistribution: ScoreDistributionBucket[];
  prePerfectCount: number;
  postPerfectCount: number;
  bothPerfectCount: number;
  perfectScoreParticipants: { id: string; name: string; unit: string; preTimestamp: string | null; postTimestamp: string | null }[];
  preMin: number | null;
  preMax: number | null;
  postMin: number | null;
  postMax: number | null;
  pairs: LearningPair[];
}

export interface AttendanceMetrics {
  databaseParticipantCount: number;
  registeredCount: number;
  /** Present in Zoom with >=5 minutes (or no duration on record at all), a looser "showed up" count. */
  zoomPresentCount: number;
  /** Present in Zoom above the webinar's stricter attendanceThresholdMinutes (default 30). */
  zoomValidAttendeeCount: number;
  registeredAndAttendedCount: number;
  attendedWithoutRegistrationCount: number;
  registeredNotAttendedCount: number;
  unidentifiedUnitCount: number;
  belowThresholdZoomCount: number;
}

export interface FeedbackQuestionMetric {
  question: string;
  type: "likert" | "text";
  responseCount: number;
  average: number | null;
}

export interface FeedbackMetrics {
  responseCount: number;
  distinctRespondentCount: number;
  questionMetrics: FeedbackQuestionMetric[];
  categoryDistribution: { category: string; count: number }[];
  textComments: { id: string; question: string; text: string; category: string | null }[];
}

export interface UnitDistributionRow {
  unit: string;
  count: number;
}

export interface QuestionActivityMetrics {
  questionCount: number;
  askerCount: number;
  topAskers: { name: string; unit: string | null; count: number }[];
  /** askerCount / attendance.zoomValidAttendeeCount, as a percentage (null when there are no valid attendees to divide by). */
  askerPercentOfAttendees: number | null;
}

export interface CompletionRates {
  preRate: number | null;
  postRate: number | null;
  feedbackRate: number | null;
}

export interface WebinarMetrics {
  attendance: AttendanceMetrics;
  learning: LearningMetrics;
  feedback: FeedbackMetrics;
  units: UnitDistributionRow[];
  /** Coarser "PLN Pusat vs anak perusahaan PLN" rollup of `units`. */
  companyGroups: UnitDistributionRow[];
  questions: QuestionActivityMetrics | null;
  completion: CompletionRates;
}

export interface CrossWebinarUnitDistribution {
  unit: string;
  webinarCounts: Record<string, number>;
  total: number;
}

export interface CrossWebinarSeriesPoint {
  webinarId: string;
  webinarNumber: number;
  webinarTitle: string;
  value: number | null;
}

export interface CrossWebinarMetrics {
  webinarCount: number;
  totalRegistered: number;
  totalZoomValidAttendees: number;
  totalPre: number;
  totalPost: number;
  totalPaired: number;
  totalFeedback: number;
  attendanceByWebinar: CrossWebinarSeriesPoint[];
  preByWebinar: CrossWebinarSeriesPoint[];
  postByWebinar: CrossWebinarSeriesPoint[];
  gainByWebinar: CrossWebinarSeriesPoint[];
  preCompletionByWebinar: CrossWebinarSeriesPoint[];
  postCompletionByWebinar: CrossWebinarSeriesPoint[];
  feedbackCompletionByWebinar: CrossWebinarSeriesPoint[];
  feedbackAverageByWebinar: CrossWebinarSeriesPoint[];
  unitDistribution: CrossWebinarUnitDistribution[];
}
