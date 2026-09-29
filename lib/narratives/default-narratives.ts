import type { Webinar, WebinarNarratives } from "@/types/webinar";
import { emptyNarratives } from "@/types/webinar";
import type { WebinarMetrics } from "@/types/analytics";
import { num } from "@/lib/theme";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `default-n-${counter}-${Math.random().toString(36).slice(2, 6)}`;
}

function item(text: string, order: number) {
  return { id: nextId(), text, order, edited: false };
}

/**
 * Deterministic starting narrative built only from computed metrics — used
 * whenever a workbook has no Narratives sheet. Every sentence leads with a
 * plain, single-point statement (no compound em-dash clauses) so the
 * headline finding is obvious before any supporting detail.
 */
export function generateDefaultNarratives(webinar: Webinar, metrics: WebinarMetrics): WebinarNarratives {
  const out = emptyNarratives();
  const { attendance, learning, feedback, completion, units } = metrics;

  let i = 0;
  out.finding.push(
    item(
      `Webinar ini dihadiri ${num(attendance.zoomValidAttendeeCount)} peserta valid, dari ${num(attendance.registeredCount)} peserta yang melakukan registrasi.`,
      i++,
    ),
  );
  if (learning.pairedCount > 0) {
    out.finding.push(
      item(
        `Pemahaman peserta meningkat setelah webinar. Rata-rata skor naik dari ${learning.preAverage} menjadi ${learning.postAverage} pada ${num(learning.pairedCount)} peserta yang mengisi pre-test dan post-test (kenaikan rata-rata ${learning.pairedGainAverage} poin).`,
        i++,
      ),
    );
  }
  const likertQs = feedback.questionMetrics.filter((q) => q.type === "likert" && q.average != null);
  if (likertQs.length > 0) {
    const overallAvg = likertQs.reduce((s, q) => s + (q.average as number), 0) / likertQs.length;
    out.finding.push(item(`Tingkat kepuasan peserta terhadap webinar ini rata-rata ${overallAvg.toFixed(2)} dari skala 5.`, i++));
  }
  if (completion.preRate != null && completion.preRate < 50) {
    out.finding.push(
      item(`Tingkat pengisian evaluasi masih rendah. Hanya ${completion.preRate}% peserta hadir yang mengisi pre-test.`, i++),
    );
  }

  let j = 0;
  if (likertQs.length > 0) {
    const best = [...likertQs].sort((a, b) => (b.average as number) - (a.average as number))[0];
    out.strength.push(item(`Aspek yang paling diapresiasi peserta adalah "${best.question}", dengan rata-rata skor ${best.average?.toFixed(2)} dari 5.`, j++));
  }
  if (learning.pairedCount > 0 && learning.improvedCount >= learning.pairedCount / 2) {
    out.strength.push(
      item(
        `Sebagian besar peserta yang mengikuti pre-test dan post-test menunjukkan peningkatan pemahaman: ${num(learning.improvedCount)} dari ${num(learning.pairedCount)} peserta meningkat.`,
        j++,
      ),
    );
  }
  if (attendance.registeredAndAttendedCount > 0 || attendance.attendedWithoutRegistrationCount > 0) {
    out.strength.push(
      item(`Sebanyak ${num(attendance.zoomValidAttendeeCount)} peserta tercatat hadir dengan durasi Zoom valid di atas ambang batas yang ditetapkan.`, j++),
    );
  }

  let k = 0;
  if (likertQs.length > 1) {
    const worst = [...likertQs].sort((a, b) => (a.average as number) - (b.average as number))[0];
    out.improvement.push(
      item(`Aspek yang mendapat penilaian relatif rendah adalah "${worst.question}", dengan rata-rata skor ${worst.average?.toFixed(2)} dari 5. Ini perlu menjadi perhatian untuk perbaikan berikutnya.`, k++),
    );
  }
  if (attendance.unidentifiedUnitCount > 0) {
    out.improvement.push(
      item(`Masih ada ${num(attendance.unidentifiedUnitCount)} peserta yang unit kerjanya belum teridentifikasi, sehingga distribusi unit belum sepenuhnya akurat.`, k++),
    );
  }
  if (completion.postRate != null && completion.postRate < 50) {
    out.improvement.push(item(`Tingkat pengisian post-test masih rendah dibanding jumlah peserta yang hadir (${completion.postRate}%).`, k++));
  }
  if (feedback.distinctRespondentCount === 0) {
    out.improvement.push(item("Belum ada peserta yang mengisi feedback pada webinar ini.", k++));
  }

  let l = 0;
  out.recommendation.push(item("Dorong lebih banyak peserta untuk mengisi pre-test, post-test, dan feedback saat webinar berlangsung.", l++));
  if (attendance.unidentifiedUnitCount > 0) {
    out.recommendation.push(item("Minta peserta menggunakan format nama Zoom yang konsisten (misalnya unit kerja_nama peserta) agar lebih mudah diidentifikasi.", l++));
  }
  if (attendance.attendedWithoutRegistrationCount > attendance.registeredAndAttendedCount) {
    out.recommendation.push(item("Sinkronkan proses registrasi dengan akses Zoom, karena cukup banyak peserta yang hadir tanpa melakukan registrasi.", l++));
  }

  let m = 0;
  if (webinar.importInfo.reconstructed) {
    out.limitation.push(item("Data webinar ini merupakan hasil rekonstruksi dari dashboard versi lama, bukan hasil unggahan file Excel langsung. Detail lengkap tersedia di halaman Kualitas Data.", m++));
  }
  const hasDemographics = ["gender", "age", "education", "position"].some((key) =>
    webinar.participants.some((p) => (p as unknown as Record<string, unknown>)[key] != null),
  );
  if (!hasDemographics) {
    out.limitation.push(item("Data demografi (jenis kelamin, usia, pendidikan, jabatan) tidak tersedia pada file sumber, sehingga tidak ditampilkan.", m++));
  }
  if (webinar.importInfo.unmatchedPre.length > 0) {
    out.limitation.push(item(`Terdapat ${num(webinar.importInfo.unmatchedPre.length)} data pre-test yang tidak dapat dicocokkan ke database peserta, dan tidak dipasangkan secara otomatis.`, m++));
  }
  if (webinar.importInfo.duplicateRowCount > 0) {
    out.limitation.push(item(`${num(webinar.importInfo.duplicateRowCount)} baris duplikat ditemukan saat impor dan telah digabungkan (data dari attempt terbaru yang dipertahankan).`, m++));
  }
  if (units.length === 0) {
    out.limitation.push(item("Belum ada data unit kerja peserta yang tercatat sebagai hadir valid.", m++));
  }

  return out;
}
