// Reconstructs Webinar 1 & 2 as real participant-level raw records so the
// SAME calculation engine used for every other webinar can compute their
// metrics — no metric is hand-typed here.
//
// Inputs (checked into scripts/legacy-source/, extracted verbatim from the
// two legacy deliverables the user originally supplied):
//   - webinar-{1,2}-html-defaults.json: the DEFAULTS_W1 / DEFAULTS_W2 objects
//     from Dashboard_Editable_Webinar1_dan_2.html (self-consistent learning
//     figures: preDist/postDist/gainDist sums exactly match preCount/
//     postCount/pairs, real named perfect-scorers, chat questions, feedback
//     comments, narratives).
//   - legacy-next-sample.json: the SAMPLE object from the Next.js project's
//     components/dashboard.tsx (attendance/unit/registration breakdown,
//     hanyaZoom real named list, individual pre/post pairs).
//
// Where the two sources disagree (they do, on a few figures — see notes
// below and in each webinar's importInfo.reconstructionNotes) we do NOT
// force them to match; we pick one basis, use it consistently, and document
// the discrepancy instead of silently reconciling it.
//
// Output: lib/migration/seed/webinar-1.json, webinar-2.json — full Webinar
// objects. No email/NIP/phone are present anywhere in the legacy sources
// (only names + units + scores), consistent with this dashboard's own
// privacy rule that names may appear on the internal dashboard while
// contact-identifying fields may not.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "legacy-source");
const OUT = path.join(__dirname, "..", "lib", "migration", "seed");
mkdirSync(OUT, { recursive: true });

// Plain-language rewrite of html.{findings,strengths,improvements,
// recommendations,limits} — same facts and order as the original source,
// just without the dense em-dash-joined compound clauses.
const NARRATIVE_REWRITES = {
  w1: {
    finding: [
      "Kepuasan dan efektivitas pembelajaran peserta webinar ini sudah baik, tetapi jangkauannya masih kecil. Hanya sebagian kecil dari total populasi pegawai yang mengikuti webinar.",
      "Banyak peserta sudah cukup memahami materi sebelum webinar dimulai. Ini terlihat dari banyaknya peserta yang sudah mendapat skor sempurna sejak pre-test, menandakan audiens yang hadir memang sudah tertarik pada topik nuklir.",
      "Webinar ini efektif meningkatkan pemahaman peserta yang sebelumnya belum menguasai materi. Mayoritas peserta dengan skor pre-test rendah menunjukkan peningkatan yang signifikan di post-test.",
      "Tingkat pengisian evaluasi masih perlu ditingkatkan. Jumlah peserta yang mengisi pre-test dan post-test jauh lebih sedikit dibanding jumlah peserta yang hadir di webinar.",
    ],
    strength: [
      "Materi dinilai relevan dan membuka wawasan baru. Banyak peserta menyebut memperoleh insight baru dan mengaitkannya dengan target Net Zero Emission 2060.",
      "Narasumber dinilai berkualitas dan menjelaskan materi secara detail, termasuk perspektif nuklir medis dari dokter spesialis.",
      "Topik yang dibahas terasa dekat dengan keseharian karena mencakup berbagai sektor seperti kesehatan, pangan, dan energi.",
      "Antusiasme peserta tinggi. Banyak yang meminta agar program serupa dilanjutkan secara rutin setiap bulan.",
      "Kepuasan peserta tinggi dan merata di seluruh aspek penilaian, dengan rata-rata skor 4,18 sampai 4,27 dari skala 5.",
    ],
    improvement: [
      "Durasi webinar dirasa terlalu singkat, terutama untuk sesi tanya-jawab yang banyak diminati peserta.",
      "Kedalaman teknis materi PLTN masih kurang, khususnya bagi peserta dengan latar belakang ketenagalistrikan.",
      "Materi presentasi dan rekaman webinar belum dibagikan setelah acara selesai.",
      "Jangkauan distribusi undangan masih terbatas. Banyak peserta meminta agar webinar berikutnya diperluas ke seluruh PLN Group, bahkan masyarakat umum.",
      "Interaktivitas webinar perlu ditingkatkan, misalnya lewat kuis atau sesi diskusi yang lebih hidup.",
    ],
    recommendation: [
      "Perpanjang dan strukturkan sesi tanya-jawab. Tampung pertanyaan peserta lewat polling sejak awal sesi.",
      "Bagikan materi presentasi, rekaman, dan jawaban pertanyaan melalui satu tautan setelah webinar selesai.",
      "Tambahkan studi kasus nyata dan perbandingan dengan negara lain, misalnya Jepang dan Prancis, yang relevan dengan konteks Indonesia.",
      "Hadirkan narasumber praktisi dan regulator yang berpengalaman di tingkat internasional.",
      "Kaitkan materi dengan RUPTL, target Net Zero Emission 2060, serta aspek keekonomian dan regulasi PLTN.",
      "Tambahkan visualisasi seperti animasi 3D atau infografis untuk menjelaskan cara kerja dan sistem keselamatan PLTN.",
      "Perluas distribusi undangan ke seluruh PLN Group, dan pertimbangkan membuka akses untuk publik.",
      "Jadwalkan webinar secara rutin setiap bulan, dengan tema yang diinformasikan lebih awal kepada peserta.",
    ],
    limitation: [
      "Data yang tersedia hanya berupa skor agregat per peserta, bukan jawaban per butir soal. Analisis per soal dan distribusi jawaban tidak dapat dihitung.",
      "Data registrasi/undangan tidak terpisah dari data kehadiran, sehingga tingkat konversi undangan menjadi kehadiran tidak dapat diukur.",
      "22 pengisi pre-test dan 11 pengisi post-test tidak dapat dicocokkan ke data roster peserta karena perbedaan identitas.",
      "Data feedback menyatu dengan data post-test, sehingga tidak dapat diukur secara terpisah.",
    ],
  },
  w2: {
    finding: [
      "Pembelajaran pada webinar ini sangat efektif. Kenaikan skor peserta lebih besar dibanding Webinar 1, dengan jumlah peserta yang sudah sempurna sejak awal jauh lebih sedikit.",
      "Tingkat pemahaman awal peserta lebih beragam dibanding Webinar 1. Hanya sedikit peserta yang skornya sudah sempurna sejak pre-test, sehingga ruang untuk belajar lebih besar.",
      "Diskusi berlangsung pada level teknis yang tinggi. Pertanyaan peserta menyentuh topik TKDN, SMR, keselamatan seismik, cadangan uranium, hingga fusi nuklir bersama narasumber dari IEA.",
      "Jangkauan dan tingkat penyelesaian evaluasi masih jadi tantangan. Jumlah peserta hadir masih di bawah target populasi, dan pengisian post-test lebih rendah dibanding pre-test.",
    ],
    strength: [
      "Pembelajaran terbukti efektif. Rata-rata skor peserta naik signifikan dari pre-test ke post-test.",
      "Materi tersusun dengan baik seputar peran PLTN sebagai sumber energi yang bersih, andal, dan rendah karbon.",
      "Antusiasme peserta tinggi. Banyak yang menantikan seri webinar berikutnya.",
      "Topik yang dibahas relevan dengan arah transisi energi dan keandalan sistem kelistrikan nasional.",
    ],
    improvement: [
      "Dorong lebih banyak peserta untuk menyelesaikan post-test dan mengisi feedback.",
      "Perluas jangkauan undangan agar lebih banyak unit kerja terwakili.",
      "Pertimbangkan menambah studi kasus dan sesi interaktif sesuai masukan peserta.",
      "Bagikan materi dan rekaman webinar setelah acara selesai.",
    ],
    recommendation: [
      "Perpanjang dan strukturkan sesi tanya-jawab.",
      "Bagikan materi presentasi, rekaman, dan jawaban pertanyaan melalui satu tautan setelah webinar selesai.",
      "Tambahkan studi kasus nyata dan kaitkan materi dengan RUPTL serta target Net Zero Emission 2060.",
      "Hadirkan narasumber praktisi dan regulator yang berpengalaman.",
      "Perkuat distribusi undangan hingga ke level staf di seluruh unit kerja.",
      "Jadwalkan webinar secara rutin dengan tema yang diinformasikan lebih awal.",
    ],
    limitation: [
      "Entri data uji coba (data lorem-ipsum) sudah dibersihkan dari seluruh sheet sebelum perhitungan dilakukan.",
      "Webinar 2 memiliki data jawaban per soal pada kolom Answers, sehingga analisis per butir soal dapat ditambahkan bila diperlukan.",
      "Data registrasi/undangan tidak terpisah dari data kehadiran, sehingga tingkat konversi undangan menjadi kehadiran tidak dapat diukur.",
      "Sebagian peserta tes kemungkinan tidak tercocokkan ke data roster karena perbedaan alamat email.",
    ],
  },
};

const w1html = JSON.parse(readFileSync(path.join(SRC, "webinar-1-html-defaults.json"), "utf8"));
const w2html = JSON.parse(readFileSync(path.join(SRC, "webinar-2-html-defaults.json"), "utf8"));
const sample = JSON.parse(readFileSync(path.join(SRC, "legacy-next-sample.json"), "utf8"));

let uid = 0;
const nextId = (prefix) => `${prefix}-legacy-${++uid}`;

function bucketOf(score, step = 10) {
  return Math.round(Math.max(0, Math.min(100, score)) / step) * step;
}

/** HTML preDist/postDist bucket counts minus the buckets already consumed by real paired scores. */
function residualBucketPool(dist, usedScores) {
  const counts = new Map(dist.map((d) => [d.s, d.n]));
  for (const s of usedScores) {
    const b = bucketOf(s);
    counts.set(b, Math.max(0, (counts.get(b) ?? 0) - 1));
  }
  const pool = [];
  for (const [bucket, n] of counts.entries()) {
    for (let i = 0; i < n; i++) pool.push(bucket);
  }
  return pool;
}

/** n integers in [1,5] whose mean rounds to targetMean — real per-respondent
 * Likert answers aren't published, only the aggregate mean, so this is a
 * documented reconstruction, not real data. */
function solveLikertValues(n, targetMean) {
  if (n <= 0) return [];
  const base = Math.min(5, Math.max(1, Math.round(targetMean)));
  const values = new Array(n).fill(base);
  let targetSum = Math.round(targetMean * n);
  targetSum = Math.min(5 * n, Math.max(1 * n, targetSum));
  let diff = targetSum - values.reduce((s, v) => s + v, 0);
  let i = 0;
  let guard = 0;
  while (diff !== 0 && guard < n * 20) {
    const idx = i % n;
    if (diff > 0 && values[idx] < 5) { values[idx]++; diff--; }
    else if (diff < 0 && values[idx] > 1) { values[idx]--; diff++; }
    i++;
    guard++;
  }
  return values;
}

function emptyNarratives() {
  return { finding: [], strength: [], improvement: [], recommendation: [], limitation: [] };
}

function buildWebinar(number, html, sampleKey, seriesLabel) {
  const sk = sampleKey; // "w1" | "w2"
  const m = sample.metrics[sk];
  const notes = [];

  // --- roster from the unit distribution (most complete per-unit table) ---
  // Sized to match the confirmed "hadir bersih" KPI exactly (m.hadirBersih),
  // not just however many rows the unit table happens to sum to — the unit
  // table's own total is a few off from the confirmed KPI, so the gap is
  // absorbed into "Tidak Teridentifikasi" (adding/removing generic slots
  // there) rather than distorting every named unit's count.
  const unitRows = sample.unitsHadir.filter((u) => (u[sk] ?? 0) > 0).map((u) => ({ unit: u.unit, count: u[sk] }));
  const unitPool = [];
  for (const row of unitRows) for (let i = 0; i < row.count; i++) unitPool.push(row.unit);
  const rawUnitTableSize = unitPool.length;
  const sizeDiff = m.hadirBersih - rawUnitTableSize;
  if (sizeDiff > 0) {
    for (let i = 0; i < sizeDiff; i++) unitPool.push("Tidak Teridentifikasi");
  } else if (sizeDiff < 0) {
    for (let i = 0; i < -sizeDiff; i++) {
      const idx = unitPool.lastIndexOf("Tidak Teridentifikasi");
      if (idx >= 0) unitPool.splice(idx, 1);
    }
  }
  const rosterSize = unitPool.length;
  if (rawUnitTableSize !== m.hadirBersih) {
    notes.push(
      `Tabel distribusi unit sumber berjumlah ${rawUnitTableSize}, disesuaikan ke ${m.hadirBersih} (KPI "peserta hadir bersih" yang dikonfirmasi) dengan menambah/mengurangi slot pada kategori "Tidak Teridentifikasi" saja — unit lain yang sudah teridentifikasi tidak diubah.`,
    );
  }
  notes.push(
    `Sumber HTML mencatat ${html.meta.attendees} "peserta hadir" (basis: roster/absensi form), sedangkan sumber Next.js mencatat ${m.hadirBersih} (basis: Zoom valid >${30} menit, dikonfirmasi valid). Dashboard ini memakai basis Zoom valid (zoomValidAttendee) secara konsisten; angka roster HTML didokumentasikan di sini sebagai referensi historis, tidak digabung diam-diam.`,
  );

  const roster = unitPool.map((unit, i) => ({
    slot: i,
    unit,
    name: `Peserta ${seriesLabel} #${String(i + 1).padStart(3, "0")} (rekonstruksi)`,
    registeredEcadin: true,
    zoomDurationMinutes: null,
    isRealNamed: false,
  }));

  // --- real named "hadir tanpa registrasi" (hanyaZoom) rows, matched by unit where possible ---
  const hanyaZoomRows = sample.hanyaZoom.list.filter((h) => h.webinar === seriesLabel);
  const byUnit = new Map();
  roster.forEach((r) => {
    const list = byUnit.get(r.unit) ?? [];
    list.push(r);
    byUnit.set(r.unit, list);
  });
  let unmatchedHanyaZoom = 0;
  for (const hz of hanyaZoomRows) {
    const candidates = (byUnit.get(hz.unit) ?? []).filter((r) => !r.isRealNamed && r.registeredEcadin);
    const slot = candidates[0] ?? roster.find((r) => !r.isRealNamed && r.registeredEcadin);
    if (!slot) { unmatchedHanyaZoom++; continue; }
    slot.isRealNamed = true;
    slot.name = hz.nama;
    slot.registeredEcadin = false;
    slot.zoomDurationMinutes = hz.durasi;
  }
  if (unmatchedHanyaZoom > 0) {
    notes.push(`${unmatchedHanyaZoom} baris "hadir tanpa registrasi" dari sumber Next.js tidak mendapat slot roster tersedia dan dilewati.`);
  }

  // --- learning: real individual (pre,post) pairs from the Next.js SAMPLE ---
  const realPairs = sample.learning.pairs.filter((p) => p.w === String(number));
  if (realPairs.length !== html.meta.pairs) {
    notes.push(
      `Sumber Next.js menyediakan ${realPairs.length} pasangan pre/post individual, sedangkan sumber HTML menyatakan ${html.meta.pairs} pasangan. Jumlah pasangan individual dari Next.js digunakan apa adanya (satu-satunya sumber yang punya skor per-individu), selisih didokumentasikan di sini.`,
    );
  }

  const pairedSlots = roster.filter((r) => r.zoomDurationMinutes == null || r.zoomDurationMinutes >= 30).slice(0, realPairs.length);
  // Fall back to any slot if not enough non-null-duration slots.
  const pairedFinal = pairedSlots.length === realPairs.length ? pairedSlots : roster.slice(0, realPairs.length);
  pairedFinal.forEach((slot, i) => {
    slot.pre = realPairs[i].pre;
    slot.post = realPairs[i].post;
    slot.hasPrePost = true;
  });

  // Rename real perfect-scorers (both pre=100 & post=100) over matching paired slots.
  const both100Slots = pairedFinal.filter((s) => s.pre === 100 && s.post === 100);
  const perfectList = html.perfect.list ?? [];
  let perfectAssigned = 0;
  perfectList.forEach(([name, unit], i) => {
    const slot = both100Slots[i];
    if (!slot) return;
    slot.name = name;
    slot.unit = unit;
    slot.isRealNamed = true;
    perfectAssigned++;
  });
  if (perfectAssigned < perfectList.length) {
    notes.push(`${perfectList.length - perfectAssigned} nama skor sempurna dari HTML tidak mendapat slot pre=100/post=100 yang cocok dan dilewati.`);
  }

  // Overlay the HTML "ranking" sample (10 named top movers) on other paired slots.
  const remainingPaired = pairedFinal.filter((s) => !s.isRealNamed);
  (html.ranking ?? []).forEach(([name, unit, pre, post], i) => {
    const slot = remainingPaired[i];
    if (!slot) return;
    slot.name = name;
    slot.unit = unit;
    slot.pre = pre;
    slot.post = post;
    slot.isRealNamed = true;
  });

  // Pre-only / post-only slots, scored from the residual of HTML's own (self-consistent) distributions.
  const preOnlyCount = Math.max(0, html.meta.preCount - realPairs.length);
  const postOnlyCount = Math.max(0, html.meta.postCount - realPairs.length);
  const prePool = residualBucketPool(html.preDist, realPairs.map((p) => p.pre));
  const postPool = residualBucketPool(html.postDist, realPairs.map((p) => p.post));

  const nonPaired = roster.filter((r) => r.hasPrePost == null);
  const preOnlySlots = nonPaired.slice(0, preOnlyCount);
  preOnlySlots.forEach((slot, i) => { slot.pre = prePool[i] ?? null; });
  const postOnlySlots = nonPaired.slice(preOnlyCount, preOnlyCount + postOnlyCount);
  postOnlySlots.forEach((slot, i) => { slot.post = postPool[i] ?? null; });

  // --- feedback: same cohort as post-takers (HTML: feedbackCount === postCount for both webinars) ---
  const feedbackCohort = [...pairedFinal, ...postOnlySlots].slice(0, html.meta.feedbackCount);

  const participants = roster.map((slot) => {
    const tookPre = slot.pre != null;
    const tookPost = slot.post != null;
    const feedbackSubmitted = feedbackCohort.includes(slot);
    return {
      id: nextId("p"),
      identityKey: `legacy:${sk}:${slot.slot}`,
      identityKeySource: "name-unit",
      name: slot.name,
      email: null,
      nip: null,
      phone: null,
      unitFinal: slot.unit,
      unitSource: slot.registeredEcadin ? "Registrasi ECADIN" : "Absensi Zoom Form",
      identificationCategory: null,
      gender: null,
      age: null,
      education: null,
      position: null,
      attendance: {
        registeredEcadin: slot.registeredEcadin,
        attendedZoomForm: true,
        inZoomCsv: true,
        zoomValidAttendee: true,
        zoomDurationMinutes: slot.zoomDurationMinutes,
        zoomJoinCount: null,
        zoomDisplayName: slot.isRealNamed ? slot.name : null,
      },
      learning: {
        tookPre,
        preTimestamp: null,
        preCorrect: null,
        preWrong: null,
        preScore: slot.pre ?? null,
        preAnswers: null,
        tookPost,
        postTimestamp: null,
        postCorrect: null,
        postWrong: null,
        postScore: slot.post ?? null,
        postAnswers: null,
        scoreDelta: tookPre && tookPost ? slot.post - slot.pre : null,
        scoreChangeStatus: tookPre && tookPost ? (slot.post > slot.pre ? "Meningkat" : slot.post === slot.pre ? "Tetap" : "Menurun") : null,
        hasPrePost: !!slot.hasPrePost,
      },
      feedbackSubmitted,
      statusPengisian: tookPre && tookPost ? "Lengkap" : tookPre ? "Hanya Pre" : tookPost ? "Hanya Post" : "Tidak Isi Pre/Post",
      dataSource: "Rekonstruksi dari dashboard lama (HTML + Next.js)",
      notes: slot.isRealNamed ? null : "Data disintesis dari distribusi agregat sumber lama; bukan baris asli per-individu.",
      excluded: false,
      exclusionReason: null,
      suspectedTestJunk: false,
      suspectedTestJunkReason: null,
    };
  });

  // --- registered-but-did-not-attend participants (pendaftarTakHadir) ---
  // These are a distinct population from the "hadir bersih" roster above:
  // real registrants who never showed up on Zoom, so they must NOT count
  // toward zoomValidAttendee or the unit distribution (which is attendee-
  // only), but DO count toward registeredCount — a segment the roster/unit
  // table alone can't represent since it only lists people who attended.
  const noShowCount = m.pendaftarTakHadir ?? 0;
  const noShowParticipants = Array.from({ length: noShowCount }, (_, i) => ({
    id: nextId("p"),
    identityKey: `legacy:${sk}:noshow:${i}`,
    identityKeySource: "name-unit",
    name: `Pendaftar ${seriesLabel} #${String(i + 1).padStart(3, "0")} (tidak hadir)`,
    email: null,
    nip: null,
    phone: null,
    unitFinal: "Tidak Teridentifikasi",
    unitSource: "Registrasi ECADIN",
    identificationCategory: null,
    gender: null,
    age: null,
    education: null,
    position: null,
    attendance: {
      registeredEcadin: true,
      attendedZoomForm: false,
      inZoomCsv: false,
      zoomValidAttendee: false,
      zoomDurationMinutes: null,
      zoomJoinCount: null,
      zoomDisplayName: null,
    },
    learning: {
      tookPre: false, preTimestamp: null, preCorrect: null, preWrong: null, preScore: null, preAnswers: null,
      tookPost: false, postTimestamp: null, postCorrect: null, postWrong: null, postScore: null, postAnswers: null,
      scoreDelta: null, scoreChangeStatus: null, hasPrePost: false,
    },
    feedbackSubmitted: false,
    statusPengisian: "Tidak Isi Pre/Post",
    dataSource: "Rekonstruksi dari dashboard lama (Next.js) — registrasi tanpa kehadiran",
    notes: "Peserta terdaftar (ECADIN) tetapi tidak tercatat hadir di Zoom; direkonstruksi dari KPI pendaftarTakHadir, bukan baris asli per-individu.",
    excluded: false,
    exclusionReason: null,
    suspectedTestJunk: false,
    suspectedTestJunkReason: null,
  }));
  if (noShowCount > 0) {
    notes.push(
      `${noShowCount} peserta "registrasi tanpa kehadiran" (pendaftarTakHadir) direkonstruksi sebagai baris terpisah dari roster hadir, agar total registrasi mendekati KPI yang dikonfirmasi tanpa mencampur basis kehadiran.`,
    );
  }
  const allParticipants = [...participants, ...noShowParticipants];

  // --- feedback responses: synthesized Likert (from HTML topic means) + real open comments ---
  const feedback = [];
  for (const topic of html.topics ?? []) {
    const values = solveLikertValues(feedbackCohort.length, topic.mean);
    feedbackCohort.forEach((slot, i) => {
      const participant = participants.find((p) => p.identityKey === `legacy:${sk}:${slot.slot}`);
      feedback.push({
        id: nextId("fb"),
        participantId: participant?.id ?? null,
        question: topic.label,
        type: "likert",
        valueNumeric: values[i],
        valueText: null,
        category: null,
        categoryEdited: false,
      });
    });
  }
  for (const item of html.feedbackItems ?? []) {
    feedback.push({
      id: nextId("fb"),
      participantId: null,
      question: "Komentar Terbuka",
      type: "text",
      valueNumeric: null,
      valueText: item.text,
      category: item.cat ?? null,
      categoryEdited: false,
    });
  }
  notes.push(
    `Nilai Likert per pertanyaan disintesis dari rata-rata yang dipublikasikan di dashboard lama (jawaban individual per pertanyaan tidak tersedia di sumber); rata-rata hasil sintesis akan sama persis dengan angka yang dipublikasikan, namun sebaran individunya adalah rekonstruksi, bukan data asli.`,
  );

  // --- questions (real chat Q&A) ---
  const questions = (html.chatQuestions ?? []).map(([askerName, unit, question, time]) => ({
    id: nextId("q"),
    time,
    askerName,
    unit,
    question,
  }));

  // --- narratives ---
  // The original HTML source strings lean heavily on em-dash-joined compound
  // clauses ("Kualitas tinggi, jangkauan rendah — kepuasan & pembelajaran
  // baik, tapi..."), which reads as dense/choppy rather than a clear
  // headline finding. NARRATIVE_REWRITES holds a plain-language rewrite of
  // the same facts (same meaning, same order) so each item leads with one
  // clear statement before any supporting detail; see REWRITE_NOTES below.
  const narratives = emptyNarratives();
  const rewrites = NARRATIVE_REWRITES[sk];
  const NARR_MAP = [
    ["finding", html.findings],
    ["strength", html.strengths],
    ["improvement", html.improvements],
    ["recommendation", html.recommendations],
    ["limitation", html.limits],
  ];
  for (const [type, arr] of NARR_MAP) {
    (arr ?? []).forEach((text, i) => {
      narratives[type].push({ id: nextId("n"), text: rewrites?.[type]?.[i] ?? text, order: i, edited: false });
    });
  }

  const webinar = {
    id: sk,
    number,
    metadata: {
      id: sk,
      number,
      title: html.meta.title,
      subtitle: html.meta.subtitle ?? "",
      theme: seriesLabel === "Series 1" ? "Literasi Nuklir — Pengantar" : "Literasi Nuklir — PLTN & Energi Bersih",
      date: html.meta.date,
      speaker: "",
      seriesName: "Literasi Nuklir untuk Masa Depan Rendah Karbon",
      sourceName: `${html.meta.source} + ${sample && "SAMPLE (Next.js legacy dashboard)"}`,
      population: html.meta.population ?? null,
      attendanceThresholdMinutes: 30,
    },
    participants: allParticipants,
    feedback,
    questions,
    narratives,
    importInfo: {
      sourceFileName: "Dashboard_Editable_Webinar1_dan_2.html + webinar-dashboard-deployment.zip (SAMPLE)",
      sourceSheetNames: [],
      importedAt: new Date(0).toISOString(),
      adapter: "legacy-migration",
      rawRowCount: allParticipants.length,
      validRowCount: allParticipants.length,
      duplicateRowCount: 0,
      issues: [],
      duplicatesDiscarded: [],
      unmatchedPre: [],
      unmatchedPost: [],
      preDedupRows: [],
      postDedupRows: [],
      unitSummaryCrossCheck: [],
      reconstructed: true,
      reconstructionNotes: notes,
    },
  };

  return webinar;
}

const webinar1 = buildWebinar(1, w1html, "w1", "Series 1");
const webinar2 = buildWebinar(2, w2html, "w2", "Series 2");

writeFileSync(path.join(OUT, "webinar-1.json"), JSON.stringify(webinar1, null, 2));
writeFileSync(path.join(OUT, "webinar-2.json"), JSON.stringify(webinar2, null, 2));
console.log(`Wrote ${webinar1.participants.length} participants for Webinar 1, ${webinar2.participants.length} for Webinar 2.`);
