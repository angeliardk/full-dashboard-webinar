import type { Webinar } from "@/types/webinar";

const LEGACY_KEY = "webinar-dashboard-seen-seed-ids";
const KEY = "webinar-dashboard-seen-seed-versions";

/**
 * Fast, non-cryptographic content hash (FNV-1a) over a seed webinar's full
 * JSON -- cheap enough to run on every load for all seeds, and sensitive to
 * any change (a unit-name fix, a new field like crossWebinarKey, a
 * timestamp correction, ...). Not for anything security-sensitive; it's
 * purely a "did this seed's content change since we last synced it?" check.
 */
export function hashWebinarContent(w: Webinar): string {
  const s = JSON.stringify(w);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function readMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return migrateLegacy();
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Browsers that already visited before this version-tracking existed only
 * have the old plain-id list. Carry each of those ids over with a
 * sentinel "" version (guaranteed to mismatch any real content hash, so
 * the next load refreshes it exactly once) -- this still marks the id as
 * "seen" so a webinar the admin deliberately deleted stays deleted, it
 * just also stops being silently stuck on stale content forever.
 */
function migrateLegacy(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return {};
    const map: Record<string, string> = {};
    for (const id of parsed) if (typeof id === "string") map[id] = "";
    return map;
  } catch {
    return {};
  }
}

/** The content version (hash) this browser last synced for a given seed id, or null if never seen. */
export function getSeenSeedVersion(id: string): string | null {
  const map = readMap();
  return Object.prototype.hasOwnProperty.call(map, id) ? map[id] : null;
}

export function markSeedVersionsSeen(entries: { id: string; version: string }[]): void {
  if (typeof window === "undefined" || entries.length === 0) return;
  const map = readMap();
  for (const { id, version } of entries) map[id] = version;
  window.localStorage.setItem(KEY, JSON.stringify(map));
}

/** Convenience wrapper over markSeedVersionsSeen for callers that just saved these exact webinars and want their current content hashed and recorded in one step (e.g. after a full seed reset). */
export function markSeedIdsSeenAtVersion(webinars: Webinar[]): void {
  markSeedVersionsSeen(webinars.map((w) => ({ id: w.id, version: hashWebinarContent(w) })));
}
