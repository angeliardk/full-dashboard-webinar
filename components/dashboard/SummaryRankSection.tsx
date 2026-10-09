"use client";

import React, { useMemo } from "react";
import { Trophy, Repeat, GraduationCap, HelpCircle, Award, Info } from "lucide-react";
import { Card, SectionTitle, Kpi, EmptyState, Badge } from "./ui/primitives";
import { C, num } from "@/lib/theme";
import { calculateCrossWebinarRankMetrics } from "@/lib/analytics/cross-webinar-rank";
import type { Webinar } from "@/types/webinar";

const MEDAL_COLORS = [C.amber, C.slate, "#B87333"]; // gold / silver / bronze-ish

function RankBadge({ rank }: { rank: number }) {
  const color = rank <= 3 ? MEDAL_COLORS[rank - 1] : C.slateSoft;
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{ background: color }}
    >
      {rank}
    </span>
  );
}

export function SummaryRankSection({ webinars }: { webinars: Webinar[] }) {
  const metrics = useMemo(() => calculateCrossWebinarRankMetrics(webinars), [webinars]);

  if (webinars.length === 0) {
    return <EmptyState title="Belum ada data webinar" hint="Tambahkan webinar untuk melihat ringkasan peringkat." />;
  }

  return (
    <div className="space-y-4">
      <Card className="flex items-start gap-2.5 p-4" style={{ background: "#F3F7FF" }}>
        <Info size={16} style={{ color: C.blue, marginTop: 2 }} />
        <p className="text-[12px]" style={{ color: C.inkSoft }}>
          Peringkat di halaman ini membandingkan peserta <b>antar webinar #1–#{metrics.totalWebinars}</b>, dicocokkan lewat
          email yang sudah dianonimkan (satu arah, tidak bisa dibalik ke email asli). Dari {num(metrics.identifiablePeopleCount)}{" "}
          peserta yang bisa dicocokkan lintas webinar, sebagian besar peserta Webinar #1 &amp; #2 tidak ikut terhitung di sini
          karena data lama keduanya direkonstruksi tanpa identitas individual — bukan kesalahan pencocokan.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Webinar Dibandingkan" value={metrics.totalWebinars} accent={C.slate} />
        <Kpi label="Peserta Teridentifikasi" value={metrics.identifiablePeopleCount} accent={C.cyan} />
        <Kpi label="Paling Konsisten" value={metrics.consistency[0]?.attendedCount ?? 0} accent={C.blue} sub={metrics.consistency[0]?.name ?? "-"} />
        <Kpi label="Hero Awareness #1" value={metrics.heroAwareness[0]?.score ?? 0} accent={C.amber} sub={metrics.heroAwareness[0]?.name ?? "-"} />
      </div>

      {metrics.heroAwareness.length > 0 && (
        <Card className="p-5" style={{ background: "linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 100%)", borderColor: "#FDE68A" }}>
          <SectionTitle icon={Award} hint="skor gabungan: kehadiran + rata-rata post-test + keaktifan">
            🏆 Top 5 Hero Awareness ECADIN &amp; PLN
          </SectionTitle>
          <div className="space-y-2">
            {metrics.heroAwareness.map((h, i) => (
              <div key={h.crossWebinarKey} className="flex items-center gap-3 rounded-xl bg-white p-3" style={{ border: `1px solid ${C.line}` }}>
                <RankBadge rank={i + 1} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold" style={{ color: C.ink }}>{h.name}</div>
                  <div className="truncate text-[11.5px]" style={{ color: C.slateSoft }}>{h.unit}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {h.webinars.map((w) => (
                      <Badge key={w.webinarId} tone="blue">#{w.webinarNumber}</Badge>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[20px] font-bold leading-none" style={{ color: C.amber }}>{num(h.score)}</div>
                  <div className="mt-1 text-[10.5px]" style={{ color: C.slateSoft }}>
                    hadir {h.attendedCount}/{h.totalWebinars} · post {h.averagePostScore != null ? num(h.averagePostScore) : "-"} · {num(h.questionsAsked)} tanya
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle icon={Repeat} hint="jumlah webinar dihadiri valid, top 10">
            Paling Konsisten Hadir
          </SectionTitle>
          {metrics.consistency.length === 0 ? (
            <EmptyState title="Belum ada data." />
          ) : (
            <div className="space-y-1.5">
              {metrics.consistency.map((p, i) => (
                <div key={p.crossWebinarKey} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5" style={{ background: i % 2 ? C.page : "transparent" }}>
                  <RankBadge rank={i + 1} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium" style={{ color: C.ink }}>{p.name}</div>
                    <div className="truncate text-[11px]" style={{ color: C.slateSoft }}>{p.unit}</div>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {p.webinars.map((w) => (
                      <Badge key={w.webinarId} tone="green">#{w.webinarNumber}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle icon={HelpCircle} hint="nama hasil pencocokan bebas dari chat Zoom, top 10">
            Paling Aktif Bertanya
          </SectionTitle>
          {metrics.topAskers.length === 0 ? (
            <EmptyState title="Belum ada data pertanyaan." />
          ) : (
            <div className="space-y-1.5">
              {metrics.topAskers.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5" style={{ background: i % 2 ? C.page : "transparent" }}>
                  <RankBadge rank={i + 1} />
                  <div className="min-w-0 flex-1 truncate text-[12.5px] font-medium" style={{ color: C.ink }}>{p.name}</div>
                  <div className="shrink-0 text-[12.5px] font-semibold" style={{ color: C.violet }}>{num(p.totalQuestions)}×</div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {p.webinars.map((w) => (
                      <Badge key={w.webinarId} tone="amber">#{w.webinarNumber}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle icon={GraduationCap} hint="rata-rata skor, minimal ikut di 2 webinar, top 10">
            Top Pre-Test
          </SectionTitle>
          {metrics.topPreTest.length === 0 ? (
            <EmptyState title="Belum cukup data (min. ikut 2 webinar)." />
          ) : (
            <div className="space-y-1.5">
              {metrics.topPreTest.map((p, i) => (
                <div key={p.crossWebinarKey} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5" style={{ background: i % 2 ? C.page : "transparent" }}>
                  <RankBadge rank={i + 1} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium" style={{ color: C.ink }}>{p.name}</div>
                    <div className="truncate text-[11px]" style={{ color: C.slateSoft }}>{p.unit} · {p.participations}× ikut</div>
                  </div>
                  <div className="shrink-0 text-[14px] font-bold" style={{ color: C.violet }}>{num(p.averageScore)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle icon={GraduationCap} hint="rata-rata skor, minimal ikut di 2 webinar, top 10">
            Top Post-Test
          </SectionTitle>
          {metrics.topPostTest.length === 0 ? (
            <EmptyState title="Belum cukup data (min. ikut 2 webinar)." />
          ) : (
            <div className="space-y-1.5">
              {metrics.topPostTest.map((p, i) => (
                <div key={p.crossWebinarKey} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5" style={{ background: i % 2 ? C.page : "transparent" }}>
                  <RankBadge rank={i + 1} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium" style={{ color: C.ink }}>{p.name}</div>
                    <div className="truncate text-[11px]" style={{ color: C.slateSoft }}>{p.unit} · {p.participations}× ikut</div>
                  </div>
                  <div className="shrink-0 text-[14px] font-bold" style={{ color: C.green }}>{num(p.averageScore)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-start gap-2">
          <Trophy size={14} style={{ color: C.slateSoft, marginTop: 2 }} />
          <p className="text-[11.5px]" style={{ color: C.slateSoft }}>
            Formula Hero Awareness: kehadiran (maks 40 poin, proporsional dari {metrics.totalWebinars} webinar) + rata-rata skor
            post-test (maks 35 poin) + keaktifan — tanya &amp; isi feedback (maks 25 poin, jumlah pertanyaan dibatasi hingga 3x
            biar tidak mendominasi). Bobot ini bisa disesuaikan di <code>lib/analytics/cross-webinar-rank.ts</code>.
          </p>
        </div>
      </Card>
    </div>
  );
}
