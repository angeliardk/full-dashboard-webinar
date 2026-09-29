const KEY = "webinar-dashboard-seen-seed-ids";

/**
 * Tracks every seed webinar ID this browser has ever loaded, so a code
 * update that adds a new baked-in webinar (e.g. Webinar 4) can be merged in
 * automatically on next load — without requiring "Reset ke Seed Data" —
 * while never resurrecting a seed webinar the admin deliberately deleted.
 */
export function getSeenSeedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markSeedIdsSeen(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return;
  const next = new Set([...getSeenSeedIds(), ...ids]);
  window.localStorage.setItem(KEY, JSON.stringify([...next]));
}
