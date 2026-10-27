import type { FeedbackResponse, Participant, Webinar, WebinarQuestion } from "@/types/webinar";
import { emptyNarratives } from "@/types/webinar";

let counter = 0;

export function makeParticipant(overrides: Partial<Participant> & { unit?: string } = {}): Participant {
  counter += 1;
  const { unit, ...rest } = overrides;
  return {
    id: `p-${counter}`,
    identityKey: `key-${counter}`,
    identityKeySource: "email",
    name: `Peserta ${counter}`,
    email: `peserta${counter}@example.org`,
    nip: null,
    phone: null,
    unitFinal: unit ?? "PLN Pusat",
    unitSource: null,
    company: null,
    identificationCategory: null,
    gender: null,
    age: null,
    education: null,
    position: null,
    attendance: {
      registeredEcadin: false,
      attendedZoomForm: false,
      inZoomCsv: false,
      zoomValidAttendee: false,
      zoomDurationMinutes: null,
      zoomJoinCount: null,
      zoomDisplayName: null,
    },
    learning: {
      tookPre: false,
      preTimestamp: null,
      preCorrect: null,
      preWrong: null,
      preScore: null,
      preAnswers: null,
      tookPost: false,
      postTimestamp: null,
      postCorrect: null,
      postWrong: null,
      postScore: null,
      postAnswers: null,
      scoreDelta: null,
      scoreChangeStatus: null,
      hasPrePost: false,
    },
    feedbackSubmitted: false,
    statusPengisian: null,
    dataSource: null,
    notes: null,
    excluded: false,
    exclusionReason: null,
    suspectedTestJunk: false,
    suspectedTestJunkReason: null,
    crossWebinarKey: null,
    ...rest,
  };
}

export function makeWebinar(overrides: Partial<Webinar> & { participants?: Participant[]; questions?: WebinarQuestion[] } = {}): Webinar {
  counter += 1;
  const number = overrides.number ?? counter;
  return {
    id: `w${number}`,
    number,
    metadata: {
      id: `w${number}`,
      number,
      title: `Webinar ${number}`,
      subtitle: "",
      theme: "",
      date: "",
      speaker: "",
      seriesName: "Test Series",
      sourceName: "test",
      population: null,
      attendanceThresholdMinutes: 30,
    },
    participants: [],
    feedback: [],
    questions: [],
    narratives: emptyNarratives(),
    importInfo: {
      sourceFileName: null,
      sourceSheetNames: [],
      importedAt: new Date().toISOString(),
      adapter: "manual",
      rawRowCount: 0,
      validRowCount: 0,
      duplicateRowCount: 0,
      issues: [],
      duplicatesDiscarded: [],
      unmatchedPre: [],
      unmatchedPost: [],
      preDedupRows: [],
      postDedupRows: [],
      unitSummaryCrossCheck: [],
    },
    ...overrides,
  };
}

export function makeFeedback(overrides: Partial<FeedbackResponse> = {}): FeedbackResponse {
  counter += 1;
  return {
    id: `fb-${counter}`,
    participantId: null,
    question: "Pertanyaan Contoh",
    type: "likert",
    valueNumeric: 5,
    valueText: null,
    category: null,
    categoryEdited: false,
    ...overrides,
  };
}
