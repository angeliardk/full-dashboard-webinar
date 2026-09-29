import type { ImportAuditRow, Participant } from "@/types/webinar";
import type { RawParticipantRow } from "./participant-mapper";

export interface DedupResult {
  participants: Participant[];
  duplicatesDiscarded: ImportAuditRow[];
}

/** Groups candidates by identity key and keeps the most recent attempt per key. */
export function dedupeParticipants(candidates: RawParticipantRow[]): DedupResult {
  const groups = new Map<string, RawParticipantRow[]>();
  for (const c of candidates) {
    const list = groups.get(c.identity.key) ?? [];
    list.push(c);
    groups.set(c.identity.key, list);
  }

  const participants: Participant[] = [];
  const duplicatesDiscarded: ImportAuditRow[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      participants.push(group[0].participant);
      continue;
    }
    const sorted = [...group].sort((a, b) => {
      const ta = a.sortTimestamp ? Date.parse(a.sortTimestamp) : -Infinity;
      const tb = b.sortTimestamp ? Date.parse(b.sortTimestamp) : -Infinity;
      return ta - tb;
    });
    const kept = sorted[sorted.length - 1];
    participants.push(kept.participant);
    for (const dropped of sorted.slice(0, -1)) {
      duplicatesDiscarded.push({
        reason: `Duplicate key "${dropped.identity.key}"; attempt lebih baru disimpan (kept latest timestamp)`,
        raw: dropped.raw,
      });
    }
  }

  return { participants, duplicatesDiscarded };
}
