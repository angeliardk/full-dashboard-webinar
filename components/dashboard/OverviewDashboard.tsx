"use client";

import React, { useMemo } from "react";
import { Layers, Users, GraduationCap, MessageSquare, Building2 } from "lucide-react";
import { Card, SectionTitle, Kpi, EmptyState } from "./ui/primitives";
import { SeriesBarChart } from "./charts/SeriesBarChart";
import { TrendLineChart } from "./charts/TrendLineChart";
import { StackedUnitBarList } from "./charts/StackedUnitBarList";
import { calculateCrossWebinarMetrics, type WebinarWithMetrics } from "@/lib/analytics/cross-webinar";
import { C } from "@/lib/theme";

export function OverviewDashboard({ entries }: { entries: WebinarWithMetrics[] }) {
  const metrics = useMemo(() => calculateCrossWebinarMetrics(entries), [entries]);
  const webinars = useMemo(() => entries.map((e) => e.webinar), [entries]);

  if (webinars.length === 0) {
    return (
      <EmptyState
        title="Belum ada data webinar"
        hint='Klik "Tambah Webinar" untuk mengunggah data webinar pertama Anda.'
      />
    );
  }

  const attendanceData = metrics.attendanceByWebinar.map((p) => ({ name: `#${p.webinarNumber}`, hadir: p.value }));
  const learningData = metrics.preByWebinar.map((p, i) => ({
    name: `#${p.webinarNumber}`,
    pre: p.value,
    post: metrics.postByWebinar[i]?.value ?? null,
  }));
  const gainData = metrics.gainByWebinar.map((p) => ({ name: `#${p.webinarNumber}`, gain: p.value }));
  const completionData = metrics.preCompletionByWebinar.map((p, i) => ({
    name: `#${p.webinarNumber}`,
    pre: p.value,
    post: metrics.postCompletionByWebinar[i]?.value ?? null,
    feedback: metrics.feedbackCompletionByWebinar[i]?.value ?? null,
  }));
  const feedbackAvgData = metrics.feedbackAverageByWebinar.map((p) => ({ name: `#${p.webinarNumber}`, avg: p.value }));

  const webinarSeries = [...webinars].sort((a, b) => a.number - b.number).map((w) => ({ id: w.id, label: `Webinar #${w.number}` }));
  const thresholds = [...new Set(webinars.map((w) => w.metadata.attendanceThresholdMinutes))];
  const unitFootnote =
    `Perhitungan berdasarkan peserta Zoom yang tercatat hadir valid (melewati ambang batas durasi ${
      thresholds.length === 1 ? `${thresholds[0]} menit` : "masing-masing webinar"
    }) di setiap webinar. "Tidak Teridentifikasi" merujuk pada peserta valid yang unit kerjanya belum dapat dipastikan.`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <Kpi label="Jumlah Webinar" value={metrics.webinarCount} accent={C.slate} />
        <Kpi label="Total Registrasi" value={metrics.totalRegistered} accent={C.cyan} />
        <Kpi label="Total Hadir Valid" value={metrics.totalZoomValidAttendees} accent={C.blue} />
        <Kpi label="Total Pre-Test" value={metrics.totalPre} accent={C.violet} />
        <Kpi label="Total Post-Test" value={metrics.totalPost} accent={C.green} />
        <Kpi label="Total Pasangan" value={metrics.totalPaired} accent={C.amber} />
        <Kpi label="Total Feedback" value={metrics.totalFeedback} accent={C.blue} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle icon={Users} hint="peserta hadir Zoom valid per webinar">Kehadiran per Webinar</SectionTitle>
          <SeriesBarChart data={attendanceData} series={[{ key: "hadir", label: "Hadir Valid", color: C.blue }]} />
        </Card>
        <Card className="p-5">
          <SectionTitle icon={GraduationCap} hint="rata-rata skor per webinar">Pre vs Post per Webinar</SectionTitle>
          <SeriesBarChart data={learningData} series={[{ key: "pre", label: "Pre-Test", color: C.violet }, { key: "post", label: "Post-Test", color: C.green }]} />
        </Card>
        <Card className="p-5">
          <SectionTitle icon={GraduationCap} hint="rata-rata kenaikan paired per webinar">Gain per Webinar</SectionTitle>
          <SeriesBarChart data={gainData} series={[{ key: "gain", label: "Gain", color: C.amber }]} />
        </Card>
        <Card className="p-5">
          <SectionTitle icon={Layers} hint="persentase dari peserta hadir valid">Completion Rate per Webinar</SectionTitle>
          <TrendLineChart
            data={completionData}
            series={[
              { key: "pre", label: "Pre-Test %", color: C.violet },
              { key: "post", label: "Post-Test %", color: C.green },
              { key: "feedback", label: "Feedback %", color: C.blue },
            ]}
          />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <SectionTitle icon={MessageSquare} hint="rata-rata seluruh pertanyaan dengan skala Likert 1–5, per webinar">Rata-rata Kepuasan (Feedback) per Webinar</SectionTitle>
          <SeriesBarChart data={feedbackAvgData} series={[{ key: "avg", label: "Rata-rata Feedback (skala Likert 1–5)", color: C.blue }]} yDomain={[0, 5]} />
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle icon={Building2} hint="berdasarkan peserta hadir bersih, seluruh webinar">Distribusi Peserta Hadir Berdasarkan Unit Kerja</SectionTitle>
        <StackedUnitBarList rows={metrics.unitDistribution} series={webinarSeries} footnote={unitFootnote} />
      </Card>
    </div>
  );
}
