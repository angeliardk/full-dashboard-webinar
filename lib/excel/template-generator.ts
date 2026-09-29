import * as XLSX from "xlsx";

const METADATA_ROWS: [string, string | number][] = [
  ["webinar_id", "w4"],
  ["webinar_number", 4],
  ["title", "Judul Webinar"],
  ["subtitle", "Deskripsi singkat"],
  ["date", "2026-08-20 13:30"],
  ["theme", "Tema webinar"],
  ["speaker", "Nama narasumber"],
  ["series_name", "Nuclear Awareness"],
  ["source_name", "Nama file sumber"],
  ["population", 51000],
  ["attendance_threshold_minutes", 30],
];

export const PARTICIPANT_TEMPLATE_HEADERS = [
  "Participant Key",
  "Nama",
  "Email",
  "NIP",
  "Nomor HP",
  "Unit Kerja Final",
  "Jenis Kelamin",
  "Usia",
  "Pendidikan",
  "Jabatan",
  "Kategori Identifikasi",
  "Unit Source",
  "Registrasi ECADIN?",
  "Absensi Saat Zoom?",
  "Ada di Zoom CSV?",
  "Hadir Zoom >30m?",
  "Durasi Zoom Total (menit)",
  "Jumlah Join Zoom",
  "Nama Zoom Asli",
  "Isi Pre-Test?",
  "Pre Timestamp",
  "Pre Benar",
  "Pre Salah",
  "Skor Pre Final",
  "Pre Answers",
  "Isi Post-Test?",
  "Post Timestamp",
  "Post Benar",
  "Post Salah",
  "Skor Post Final",
  "Post Answers",
  "Selisih Skor Final",
  "Status Perubahan Skor",
  "Punya Pre & Post?",
  "Isi Feedback?",
  "Feedback - Materi memenuhi harapan",
  "Feedback - Relevansi dengan pekerjaan",
  "Feedback - Informasi baru diperoleh",
  "Feedback - Saran webinar berikutnya",
  "Feedback - Saran peningkatan kualitas program",
  "Status Pengisian",
  "Sumber Data",
  "Catatan",
  "Exclude?",
  "Exclusion Reason",
];

const EXAMPLE_PARTICIPANT_ROWS: (string | number | null)[][] = [
  [
    "email:contoh1@pln.co.id", "Contoh Peserta Satu", "contoh1@pln.co.id", "1234567890", "081200000001",
    "PLN Pusat", "Perempuan", 34, "S1", "Officer", "PLN / Teridentifikasi", "Registrasi ECADIN",
    "Ya", "Ya", "Ya", "Ya", 95, 1, "Contoh Peserta Satu",
    "Ya", "2026-08-20 13:40:00", 13, 2, 87, '{"q1":1,"q2":1}',
    "Ya", "2026-08-20 14:50:00", 14, 1, 93, '{"q1":1,"q2":1}',
    6, "Meningkat", "Ya", "Ya",
    5, 4, 5, "Lanjutkan program ini", "Sudah baik",
    "Lengkap", "Registrasi ECADIN, Pre-Test, Post-Test, Feedback", null, "Tidak", null,
  ],
  [
    "email:contoh2@pln.co.id", "Contoh Peserta Dua", "contoh2@pln.co.id", "9876543210", "081200000002",
    "PLN Puslitbang", "Laki-laki", 41, "S2", "Senior Officer", "PLN / Teridentifikasi", "Absensi Zoom Form",
    "Tidak", "Ya", "Ya", "Ya", 60, 1, "Contoh Peserta Dua",
    "Tidak", null, null, null, null, null,
    "Tidak", null, null, null, null, null,
    null, "Belum lengkap", "Tidak", "Tidak",
    null, null, null, null, null,
    "Tidak Isi Pre/Post", "Absensi Zoom Form", null, "Tidak", null,
  ],
];

const QUESTIONS_HEADERS = ["Time", "Asker Name", "Unit", "Question"];
const EXAMPLE_QUESTION_ROW = ["13:55", "Contoh Penanya", "PLN Pusat", "Contoh pertanyaan peserta mengenai materi webinar."];

const NARRATIVES_HEADERS = ["Type", "Text", "Order"];
const EXAMPLE_NARRATIVE_ROWS = [
  ["finding", "Contoh temuan utama berdasarkan data webinar ini.", 1],
  ["strength", "Contoh kekuatan program.", 1],
  ["improvement", "Contoh area yang perlu diperbaiki.", 1],
  ["recommendation", "Contoh rekomendasi tindak lanjut.", 1],
  ["limitation", "Contoh keterbatasan data yang tersedia.", 1],
];

export function buildTemplateWorkbook(includeExamples = true): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const metaSheet = XLSX.utils.aoa_to_sheet([["key", "value"], ...METADATA_ROWS]);
  XLSX.utils.book_append_sheet(wb, metaSheet, "Metadata");

  const participantRows = includeExamples ? EXAMPLE_PARTICIPANT_ROWS : [];
  const participantSheet = XLSX.utils.aoa_to_sheet([PARTICIPANT_TEMPLATE_HEADERS, ...participantRows]);
  XLSX.utils.book_append_sheet(wb, participantSheet, "Participants");

  const questionsSheet = XLSX.utils.aoa_to_sheet([
    QUESTIONS_HEADERS,
    ...(includeExamples ? [EXAMPLE_QUESTION_ROW] : []),
  ]);
  XLSX.utils.book_append_sheet(wb, questionsSheet, "Questions");

  const narrativesSheet = XLSX.utils.aoa_to_sheet([
    NARRATIVES_HEADERS,
    ...(includeExamples ? EXAMPLE_NARRATIVE_ROWS : []),
  ]);
  XLSX.utils.book_append_sheet(wb, narrativesSheet, "Narratives");

  return wb;
}

export function workbookToBlob(wb: XLSX.WorkBook): Blob {
  const array = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/** Browser-only: triggers a download of the official Excel template. */
export function downloadTemplateWorkbook(filename = "Template_Excel_Webinar.xlsx") {
  const wb = buildTemplateWorkbook(true);
  const blob = workbookToBlob(wb);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
