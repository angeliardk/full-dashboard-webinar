import { describe, it, expect } from "vitest";
import { looksLikeWebinar3Workbook, parseWebinar3Workbook } from "@/lib/excel/webinar3-adapter";
import type { RawWorkbook } from "@/types/import";

const REQUIRED_HEADERS = [
  "Nama", "Unit Kerja Final", "Registrasi ECADIN?", "Hadir Zoom >30m?", "Durasi Zoom Total (menit)",
  "Isi Pre-Test?", "Skor Pre Final", "Isi Post-Test?", "Skor Post Final", "Isi Feedback?",
];

function buildSyntheticWebinar3Workbook(): RawWorkbook {
  return {
    fileName: "synthetic-webinar3-like.xlsx",
    sheets: [
      {
        // Deliberately NOT named "Participants" — detection must go by header signature.
        name: "W3-Style Detail Sheet",
        headers: REQUIRED_HEADERS,
        rows: [
          { "Nama": "Peserta Uji 1", "Unit Kerja Final": "PLN Pusat", "Registrasi ECADIN?": "Ya", "Hadir Zoom >30m?": "Ya", "Durasi Zoom Total (menit)": 60, "Isi Pre-Test?": "Ya", "Skor Pre Final": 80, "Isi Post-Test?": "Ya", "Skor Post Final": 90, "Isi Feedback?": "Ya" },
          { "Nama": "Peserta Uji 2", "Unit Kerja Final": "PLN Puslitbang", "Registrasi ECADIN?": "Tidak", "Hadir Zoom >30m?": "Ya", "Durasi Zoom Total (menit)": 45, "Isi Pre-Test?": "Tidak", "Skor Pre Final": null, "Isi Post-Test?": "Tidak", "Skor Post Final": null, "Isi Feedback?": "Tidak" },
        ],
      },
      {
        name: "Ringkasan Merge",
        headers: ["Metrik", "Jumlah/Nilai", "Catatan"],
        rows: [
          { "Metrik": "Unique pengisi pre-test", "Jumlah/Nilai": 2, "Catatan": "termasuk unmatched" },
          { "Metrik": "Rata-rata skor pre-test", "Jumlah/Nilai": 75, "Catatan": "seluruh unique pre-test" },
        ],
      },
      {
        name: "Duplicate Dibuang",
        headers: ["Nama", "Alasan"],
        rows: [{ "Nama": "Peserta Duplikat Uji", "Alasan": "Duplicate pre-test attempt" }],
      },
      {
        name: "Unmatched PRE",
        headers: ["Nama", "Email"],
        rows: [{ "Nama": "Peserta Tak Match Uji", "Email": "takmatch@example.org" }],
      },
    ],
  };
}

describe("looksLikeWebinar3Workbook", () => {
  it("detects the Webinar 3 file shape by its audit sheet names, not the main sheet's name", () => {
    expect(looksLikeWebinar3Workbook(buildSyntheticWebinar3Workbook())).toBe(true);
  });

  it("returns false for a plain canonical template workbook", () => {
    const wb: RawWorkbook = {
      fileName: "plain.xlsx",
      sheets: [{ name: "Participants", headers: REQUIRED_HEADERS, rows: [] }],
    };
    expect(looksLikeWebinar3Workbook(wb)).toBe(false);
  });
});

describe("parseWebinar3Workbook", () => {
  it("finds the participant sheet regardless of its name, and wires up audit sheets", () => {
    const parsed = parseWebinar3Workbook(buildSyntheticWebinar3Workbook());
    expect(parsed.adapter).toBe("webinar3");
    expect(parsed.participants).toHaveLength(2);
    expect(parsed.unmatchedPre).toHaveLength(1);
    expect(parsed.duplicatesDiscarded.some((r) => JSON.stringify(r.raw).includes("Peserta Duplikat Uji"))).toBe(true);
  });

  it("surfaces the unmatched-PRE count as a warning instead of silently pairing it", () => {
    const parsed = parseWebinar3Workbook(buildSyntheticWebinar3Workbook());
    const unmatchedIssue = parsed.issues.find((i) => i.code === "unmatched-pre");
    expect(unmatchedIssue).toBeDefined();
    expect(unmatchedIssue?.level).toBe("warning");
  });

  it("does not count Duplicate Dibuang rows as part of the main participant calculation", () => {
    const parsed = parseWebinar3Workbook(buildSyntheticWebinar3Workbook());
    expect(parsed.participants.some((p) => p.name === "Peserta Duplikat Uji")).toBe(false);
  });
});
