import { describe, it, expect } from "vitest";
import { computeIdentityKey, detectSuspectedJunk, mapRowToParticipant, resolveParticipantColumns } from "@/lib/excel/participant-mapper";
import { dedupeParticipants } from "@/lib/excel/dedup";
import type { RawParticipantRow } from "@/lib/excel/participant-mapper";

describe("computeIdentityKey", () => {
  it("prefers a valid email over everything else", () => {
    const r = computeIdentityKey({ email: "a@b.com", nip: "123456", participantKey: "pk1", name: "A", unit: "U" });
    expect(r.source).toBe("email");
    expect(r.key).toBe("email:a@b.com");
    expect(r.warning).toBe(false);
  });

  it("falls back to NIP when there is no email", () => {
    const r = computeIdentityKey({ email: null, nip: "8914103ZY", participantKey: null, name: "A", unit: "U" });
    expect(r.source).toBe("nip");
  });

  it("falls back to participant/merge key when there is no email or NIP", () => {
    const r = computeIdentityKey({ email: null, nip: null, participantKey: "key-42", name: "A", unit: "U" });
    expect(r.source).toBe("participant-key");
  });

  it("falls back to normalized name+unit", () => {
    const r = computeIdentityKey({ email: null, nip: null, participantKey: null, name: "Budi Santoso", unit: "PLN Pusat" });
    expect(r.source).toBe("name-unit");
    expect(r.key).toBe("nu:budi santoso|pln pusat");
  });

  it("falls back to name-only with a warning when nothing else is available", () => {
    const r = computeIdentityKey({ email: null, nip: null, participantKey: null, name: "Budi", unit: null });
    expect(r.source).toBe("name-only");
    expect(r.warning).toBe(true);
  });
});

describe("detectSuspectedJunk", () => {
  it("flags obviously fake test names without deleting them", () => {
    expect(detectSuspectedJunk("test123")).not.toBeNull();
    expect(detectSuspectedJunk("asdf")).not.toBeNull();
    expect(detectSuspectedJunk("Budi Santoso")).toBeNull();
  });
});

const HEADERS = ["Nama", "Email", "Unit Kerja Final", "Hadir Zoom >30m?", "Durasi Zoom Total (menit)", "Isi Pre-Test?", "Skor Pre Final", "Pre Timestamp"];

function makeCandidate(row: Record<string, unknown>): RawParticipantRow {
  const columns = resolveParticipantColumns(HEADERS);
  return mapRowToParticipant(row, columns, 30);
}

describe("mapRowToParticipant + dedupeParticipants", () => {
  it("derives zoomValidAttendee from duration when no explicit flag column value", () => {
    const c = makeCandidate({ Nama: "Budi", Email: "budi@x.com", "Unit Kerja Final": "PLN Pusat", "Durasi Zoom Total (menit)": 45 });
    expect(c.participant.attendance.zoomValidAttendee).toBe(true);
  });

  it("keeps the latest attempt when two rows share an identity key", () => {
    const older = makeCandidate({
      Nama: "Budi", Email: "budi@x.com", "Unit Kerja Final": "PLN Pusat",
      "Isi Pre-Test?": "Ya", "Skor Pre Final": 60, "Pre Timestamp": "10/01/2026 10:00:00",
    });
    const newer = makeCandidate({
      Nama: "Budi", Email: "budi@x.com", "Unit Kerja Final": "PLN Pusat",
      "Isi Pre-Test?": "Ya", "Skor Pre Final": 90, "Pre Timestamp": "10/01/2026 12:00:00",
    });
    const { participants, duplicatesDiscarded } = dedupeParticipants([older, newer]);
    expect(participants).toHaveLength(1);
    expect(participants[0].learning.preScore).toBe(90);
    expect(duplicatesDiscarded).toHaveLength(1);
  });

  it("does not merge participants with different identity keys", () => {
    const a = makeCandidate({ Nama: "Budi", Email: "budi@x.com", "Unit Kerja Final": "PLN Pusat" });
    const b = makeCandidate({ Nama: "Sinta", Email: "sinta@x.com", "Unit Kerja Final": "PLN Pusat" });
    const { participants } = dedupeParticipants([a, b]);
    expect(participants).toHaveLength(2);
  });
});
