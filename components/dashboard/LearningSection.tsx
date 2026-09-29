"use client";

import React from "react";
import { GraduationCap, TrendingUp, Award, Trophy } from "lucide-react";
import { Card, SectionTitle, Kpi, StatChip, EmptyState } from "./ui/primitives";
import { SeriesBarChart } from "./charts/SeriesBarChart";
import { ScatterPrePost } from "./charts/ScatterPrePost";
import { C, num } from "@/lib/theme";
import { getFastestPerfectScorers } from "@/lib/analytics/learning";
import type { WebinarMetrics } from "@/types/analytics";

const RANK_COLOR = [C.amber, C.slate, "#B08D57"];

export function LearningSection({ metrics }: { metrics: WebinarMetrics }) {
  const l = metrics.learning;
  const topPerformers = getFastestPerfectScorers(l.pairs, 3);

  if (l.preRespondentCount === 0 && l.postRespondentCount === 0) {
    return (
      <Card className="p-5">
        <SectionTitle icon={GraduationCap}>Efektivitas Pembelajaran</SectionTitle>
        <EmptyState title="Data pre-test/post-test tidak tersedia" hint="Tidak ada peserta yang mengisi pre-test atau post-test pada webinar ini." />
      </Card>
    );
  }

  const preChartData = l.preDistribution.map((d) => ({ name: String(d.bucket), pre: d.count }));
  const postChartData = l.postDistribution.map((d) => ({ name: String(d.bucket), post: d.count }));
  const gainChartData = l.gainDistribution.map((d) => ({ name: String(d.bucket), gain: d.count }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Rata-rata Pre-Test" value={l.preAverage ?? "-"} accent={C.violet} sub={`n=${l.preRespondentCount}`} />
        <Kpi label="Rata-rata Post-Test" value={l.postAverage ?? "-"} accent={C.green} sub={`n=${l.postRespondentCount}`} />
        <Kpi label="Rata-rata Kenaikan (Paired)" value={l.pairedGainAverage ?? "-"} accent={C.blue} sub={`n=${l.pairedCount}`} />
        <Kpi label="Skor Sempurna (Pre & Post)" value={l.bothPerfectCount} accent={C.amber} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatChip icon={TrendingUp} label="Meningkat" value={l.improvedCount} color={C.green} />
        <StatChip icon={TrendingUp} label="Tetap" value={l.sameCount} color={C.slate} />
        <StatChip icon={TrendingUp} label="Menurun" value={l.declinedCount} color={C.red} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle icon={GraduationCap} hint="skor bucket per 10 poin">Distribusi Nilai Pre-Test</SectionTitle>
          <SeriesBarChart data={preChartData} series={[{ key: "pre", label: "Pre-Test", color: C.violet }]} height={200} />
          <p className="mt-1 text-[11px]" style={{ color: C.slateSoft }}>Min {num(l.preMin)} · Maks {num(l.preMax)}</p>
        </Card>
        <Card className="p-5">
          <SectionTitle icon={GraduationCap} hint="skor bucket per 10 poin">Distribusi Nilai Post-Test</SectionTitle>
          <SeriesBarChart data={postChartData} series={[{ key: "post", label: "Post-Test", color: C.green }]} height={200} />
          <p className="mt-1 text-[11px]" style={{ color: C.slateSoft }}>Min {num(l.postMin)} · Maks {num(l.postMax)}</p>
        </Card>
      </div>

      {l.pairs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <SectionTitle icon={TrendingUp} hint="peserta dengan pre & post">Scatter Pre vs Post</SectionTitle>
            <ScatterPrePost pairs={l.pairs.map((p) => ({ pre: p.pre, post: p.post }))} />
          </Card>
          <Card className="p-5">
            <SectionTitle icon={TrendingUp} hint="post − pre, bucket per 10 poin">Distribusi Kenaikan (Gain)</SectionTitle>
            <SeriesBarChart data={gainChartData} series={[{ key: "gain", label: "Gain", color: C.blue }]} height={200} />
          </Card>
        </div>
      )}

      <Card className="p-5">
        <SectionTitle icon={Award}>Skor Sempurna</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatChip label="Pre = 100" value={l.prePerfectCount} color={C.violet} />
          <StatChip label="Post = 100" value={l.postPerfectCount} color={C.green} />
          <StatChip label="Pre & Post = 100" value={l.bothPerfectCount} color={C.amber} />
        </div>
        {l.perfectScoreParticipants.length > 0 ? (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-xl" style={{ border: `1px solid ${C.line}` }}>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                  <th className="px-3 py-2 text-left" style={{ color: C.slate }}>Nama</th>
                  <th className="px-3 py-2 text-left" style={{ color: C.slate }}>Unit</th>
                </tr>
              </thead>
              <tbody>
                {l.perfectScoreParticipants.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.page}` }}>
                    <td className="px-3 py-1.5 font-medium" style={{ color: C.ink }}>{p.name}</td>
                    <td className="px-3 py-1.5" style={{ color: C.inkSoft }}>{p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-[12px]" style={{ color: C.slateSoft }}>Belum ada peserta dengan skor sempurna di pre dan post.</p>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle icon={Trophy} hint="skor pre & post = 100, diurutkan dari waktu submit post-test tercepat">
          Top 3 Tercepat dengan Skor Sempurna
        </SectionTitle>
        {topPerformers.length > 0 ? (
          <div className="space-y-2">
            {topPerformers.map((p, i) => (
              <div key={p.participantId} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: RANK_COLOR[i] + "0E", border: `1px solid ${RANK_COLOR[i]}33` }}>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: RANK_COLOR[i] }}
                >
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>{p.name}</div>
                  <div className="truncate text-[11.5px]" style={{ color: C.slateSoft }}>{p.unit}</div>
                </div>
                <div className="shrink-0 text-right text-[11.5px]" style={{ color: C.inkSoft }}>
                  <div>Submit pre-test: {p.preTimestamp ? new Date(p.preTimestamp).toLocaleString("id-ID") : "-"}</div>
                  <div style={{ color: C.ink, fontWeight: 600 }}>Submit post-test: {p.postTimestamp ? new Date(p.postTimestamp).toLocaleString("id-ID") : "-"}</div>
                </div>
              </div>
            ))}
            <p className="mt-1 text-[11px]" style={{ color: C.slateSoft }}>
              Diurutkan dari waktu submit post-test paling awal (bukan durasi pribadi pre→post) di antara peserta dengan skor pre dan post = 100 —
              seperti perlombaan, siapa yang mengumpulkan post-test tervalid tercepat menang, terlepas dari kapan mereka memulai pre-test.
            </p>
          </div>
        ) : (
          <EmptyState
            title="Tidak dapat diurutkan"
            hint="Belum ada peserta dengan skor pre & post = 100 yang memiliki data waktu pengumpulan post-test pada webinar ini."
          />
        )}
      </Card>
    </div>
  );
}
