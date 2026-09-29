// Generates a small synthetic (fake, non-PII) sample workbook that follows the
// official template exactly. Used as: (1) a downloadable example from the UI,
// and (2) a fixture for the canonical-template-adapter test suite.
import * as XLSX from "xlsx";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HEADERS = [
  "Participant Key", "Nama", "Email", "NIP", "Nomor HP", "Unit Kerja Final", "Jenis Kelamin", "Usia",
  "Pendidikan", "Jabatan", "Kategori Identifikasi", "Unit Source", "Registrasi ECADIN?", "Absensi Saat Zoom?",
  "Ada di Zoom CSV?", "Hadir Zoom >30m?", "Durasi Zoom Total (menit)", "Jumlah Join Zoom", "Nama Zoom Asli",
  "Isi Pre-Test?", "Pre Timestamp", "Pre Benar", "Pre Salah", "Skor Pre Final", "Pre Answers",
  "Isi Post-Test?", "Post Timestamp", "Post Benar", "Post Salah", "Skor Post Final", "Post Answers",
  "Selisih Skor Final", "Status Perubahan Skor", "Punya Pre & Post?", "Isi Feedback?",
  "Feedback - Materi memenuhi harapan", "Feedback - Relevansi dengan pekerjaan",
  "Feedback - Informasi baru diperoleh", "Feedback - Saran webinar berikutnya",
  "Feedback - Saran peningkatan kualitas program",
  "Status Pengisian", "Sumber Data", "Catatan", "Exclude?", "Exclusion Reason",
];

const UNITS = ["PLN Pusat", "PLN Puslitbang", "PLN UID Bali", "PLN Nusantara Power", "Tidak Teridentifikasi"];
const NAMES = [
  "Ayu Lestari", "Budi Santoso", "Citra Dewi", "Dedi Kurniawan", "Eka Putri", "Fajar Nugroho",
  "Gita Permata", "Hendra Wijaya", "Indah Sari", "Joko Prasetyo", "Kartika Sari", "Lukman Hakim",
  "Maya Anggraini", "Nanda Pratama", "Oki Setiawan", "Putri Ramadhani", "Qori Amelia", "Rudi Hartono",
  "Sinta Wulandari", "Tono Wijaksono",
];

function row(i) {
  const name = NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : "");
  const unit = UNITS[i % UNITS.length];
  const email = `contoh.peserta${i + 1}@example.org`;
  const tookPre = i % 4 !== 0;
  const tookPost = i % 3 !== 0;
  const preScore = tookPre ? [50, 60, 70, 80, 90, 100][i % 6] : null;
  const postScore = tookPost ? [70, 80, 90, 100, 90, 100][i % 6] : null;
  const paired = tookPre && tookPost;
  return [
    `key-${i + 1}`, name, email, `19800101${String(1000 + i)}`, `08123${String(100000 + i)}`,
    unit, i % 2 === 0 ? "Perempuan" : "Laki-laki", 25 + (i % 20), "S1", "Officer",
    "PLN / Teridentifikasi", "Registrasi ECADIN",
    i % 3 === 0 ? "Ya" : "Tidak",
    "Ya", "Ya",
    i % 5 !== 0 ? "Ya" : "Tidak",
    i % 5 !== 0 ? 60 + (i % 60) : 10,
    1, name,
    tookPre ? "Ya" : "Tidak", tookPre ? "20/08/2026 13:40:00" : null, tookPre ? 10 : null, tookPre ? 5 : null,
    preScore, tookPre ? '{"q1":1}' : null,
    tookPost ? "Ya" : "Tidak", tookPost ? "20/08/2026 14:50:00" : null, tookPost ? 12 : null, tookPost ? 3 : null,
    postScore, tookPost ? '{"q1":1}' : null,
    paired ? (postScore ?? 0) - (preScore ?? 0) : null,
    paired ? "Meningkat" : "Belum lengkap",
    paired ? "Ya" : "Tidak",
    tookPost ? "Ya" : "Tidak",
    tookPost ? 4 + (i % 2) : null,
    tookPost ? 4 : null,
    tookPost ? 5 : null,
    tookPost ? "Lanjutkan program serupa" : null,
    tookPost ? "Sudah cukup baik" : null,
    paired ? "Lengkap" : tookPre ? "Hanya Pre" : "Tidak Isi Pre/Post",
    "Registrasi ECADIN, Zoom CSV",
    null, "Tidak", null,
  ];
}

const rows = [];
for (let i = 0; i < 24; i++) rows.push(row(i));

// A duplicate identity (same email, later timestamp) to exercise dedup.
const dup = [...row(0)];
dup[1] = NAMES[0] + " (duplikat)";
dup[20] = "21/08/2026 09:00:00"; // later Pre Timestamp
rows.push(dup);

// A row with an out-of-range score and out-of-range feedback value (warning, not blocking).
const badScoreRow = row(24);
badScoreRow[23] = 130; // Skor Pre Final out of 0-100
badScoreRow[37] = 7; // Feedback - Informasi baru diperoleh, out of 1-5
rows.push(badScoreRow);

// A row with no email/nip/participant key — falls back to name+unit identity.
const noIdentity = row(25);
noIdentity[0] = null;
noIdentity[2] = null;
noIdentity[3] = null;
rows.push(noIdentity);

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ["key", "value"],
    ["webinar_id", "w4"],
    ["webinar_number", 4],
    ["title", "Webinar 4 — Contoh Data Dummy"],
    ["subtitle", "Contoh file untuk pengujian & demo template"],
    ["date", "2026-08-20 13:30"],
    ["theme", "Contoh Tema"],
    ["speaker", "Narasumber Contoh"],
    ["series_name", "Nuclear Awareness"],
    ["source_name", "sample-webinar-4.xlsx"],
    ["population", 51000],
    ["attendance_threshold_minutes", 30],
  ]),
  "Metadata",
);
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([HEADERS, ...rows]), "Participants");
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ["Time", "Asker Name", "Unit", "Question"],
    ["13:55", "Contoh Penanya", "PLN Pusat", "Apa dasar pemilihan teknologi reaktor?"],
    ["14:02", "Penanya Lain", "PLN Puslitbang", "Bagaimana pengelolaan limbahnya?"],
  ]),
  "Questions",
);

const outDir = path.join(__dirname, "..", "fixtures");
const outPublic = path.join(__dirname, "..", "public", "templates");
writeFileSync(path.join(outDir, "sample-webinar-4.xlsx"), XLSX.write(wb, { bookType: "xlsx", type: "buffer" }));
writeFileSync(path.join(outPublic, "contoh-webinar-dummy.xlsx"), XLSX.write(wb, { bookType: "xlsx", type: "buffer" }));
console.log("Generated fixtures/sample-webinar-4.xlsx and public/templates/contoh-webinar-dummy.xlsx");
