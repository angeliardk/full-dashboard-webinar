import type { FeedbackResponse } from "@/types/webinar";
import type { FeedbackMetrics, FeedbackQuestionMetric } from "@/types/analytics";
import { average } from "./helpers";

const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] = [
  { category: "Apresiasi", keywords: ["baik", "bagus", "mantap", "terima kasih", "keren", "puas", "sangat"] },
  { category: "Saran Materi", keywords: ["materi", "teknis", "studi kasus", "praktik", "contoh"] },
  { category: "Saran Teknis/Zoom", keywords: ["zoom", "audio", "suara", "koneksi", "durasi", "waktu", "jadwal"] },
  { category: "Permintaan Lanjutan", keywords: ["lanjut", "rutin", "berkala", "lagi", "berikutnya", "seri"] },
  { category: "Keluhan", keywords: ["kurang", "buruk", "lambat", "sulit", "bingung", "tidak jelas"] },
];

export function categorizeComment(text: string): string {
  const lower = text.trim().toLowerCase();
  if (!lower) return "Lainnya";
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return "Lainnya";
}

export function calculateFeedbackMetrics(feedback: FeedbackResponse[]): FeedbackMetrics {
  const byQuestion = new Map<string, FeedbackResponse[]>();
  for (const f of feedback) {
    const list = byQuestion.get(f.question) ?? [];
    list.push(f);
    byQuestion.set(f.question, list);
  }

  const questionMetrics: FeedbackQuestionMetric[] = [...byQuestion.entries()].map(([question, rows]) => {
    const type = rows[0]?.type ?? "text";
    if (type === "likert") {
      const values = rows.map((r) => r.valueNumeric).filter((v): v is number => v != null);
      return { question, type, responseCount: values.length, average: average(values) };
    }
    const values = rows.filter((r) => r.valueText != null && r.valueText.trim() !== "");
    return { question, type, responseCount: values.length, average: null };
  });

  const respondents = new Set<string>();
  for (const f of feedback) {
    if (f.participantId) respondents.add(f.participantId);
  }

  const categoryCounts = new Map<string, number>();
  const textComments: FeedbackMetrics["textComments"] = [];
  for (const f of feedback) {
    if (f.type === "text" && f.valueText && f.valueText.trim() !== "") {
      const category = f.category ?? categorizeComment(f.valueText);
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      textComments.push({ id: f.id, question: f.question, text: f.valueText, category });
    }
  }

  return {
    responseCount: feedback.length,
    distinctRespondentCount: respondents.size,
    questionMetrics: questionMetrics.sort((a, b) => (b.average ?? 0) - (a.average ?? 0)),
    categoryDistribution: [...categoryCounts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    textComments,
  };
}
