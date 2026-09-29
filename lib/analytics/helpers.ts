import type { Participant } from "@/types/webinar";

export const UNIDENTIFIED_UNIT = "Tidak Teridentifikasi";

export function activeParticipants(participants: Participant[]): Participant[] {
  return participants.filter((p) => !p.excluded);
}

export function average(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return round2(nums.reduce((s, v) => s + v, 0) / nums.length);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isUnidentifiedUnit(unit: string | null | undefined): boolean {
  if (!unit) return true;
  const trimmed = unit.trim().toLowerCase();
  return (
    trimmed === "" ||
    trimmed === UNIDENTIFIED_UNIT.toLowerCase() ||
    trimmed === "-" ||
    trimmed === "n/a" ||
    trimmed === "tidak diketahui"
  );
}

/** Buckets a 0-100 score into steps of 10 (0,10,...,100). */
export function bucketScore(score: number, step = 10): number {
  const clamped = Math.max(0, Math.min(100, score));
  return Math.round(clamped / step) * step;
}

export function toBucketDistribution(values: number[], step = 10) {
  const map = new Map<number, number>();
  for (const v of values) {
    const b = bucketScore(v, step);
    map.set(b, (map.get(b) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, count]) => ({ bucket, count }));
}

export function toGainDistribution(values: number[], step = 10) {
  const map = new Map<number, number>();
  for (const v of values) {
    const b = Math.round(v / step) * step;
    map.set(b, (map.get(b) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, count]) => ({ bucket, count }));
}

export function ratio(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return round2((numerator / denominator) * 100);
}
