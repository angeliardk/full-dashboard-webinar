"use client";

import React from "react";
import { UserCheck, UserPlus, UserX, FileWarning, Video, ClipboardList } from "lucide-react";
import { Card, SectionTitle, StatChip } from "./ui/primitives";
import { Donut } from "./charts/Donut";
import { C, num } from "@/lib/theme";
import type { Webinar } from "@/types/webinar";
import type { WebinarMetrics } from "@/types/analytics";

export function AttendanceSection({ webinar, metrics }: { webinar: Webinar; metrics: WebinarMetrics }) {
  const a = metrics.attendance;
  const comp = [
    { name: "Hadir & registrasi", value: a.registeredAndAttendedCount, color: C.green },
    { name: "Hadir tanpa registrasi", value: a.attendedWithoutRegistrationCount, color: C.amberSoft },
  ];

  const funnelSteps: { label: string; value: number | null }[] = [
    { label: "Populasi pegawai", value: webinar.metadata.population },
    { label: "Registrasi", value: a.registeredCount },
    { label: "Hadir Zoom valid (>{threshold} menit)".replace("{threshold}", String(webinar.metadata.attendanceThresholdMinutes)), value: a.zoomValidAttendeeCount },
    { label: "Pre-Test", value: metrics.learning.preRespondentCount },
    { label: "Post-Test", value: metrics.learning.postRespondentCount },
    { label: "Pasangan Pre-Post", value: metrics.learning.pairedCount },
    { label: "Feedback", value: metrics.feedback.distinctRespondentCount },
  ].filter((s) => s.value != null && s.value > 0);
  const funnelMax = Math.max(1, ...funnelSteps.map((s) => s.value as number));

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle icon={UserCheck} hint={`basis: zoomValidAttendee (>${webinar.metadata.attendanceThresholdMinutes} menit)`}>
          Komposisi Kehadiran
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatChip icon={UserCheck} label="Hadir & Registrasi" value={a.registeredAndAttendedCount} color={C.green} />
              <StatChip icon={UserPlus} label="Hadir Tanpa Registrasi" value={a.attendedWithoutRegistrationCount} color={C.amberSoft} />
              <StatChip icon={UserX} label="Registrasi, Tidak Hadir" value={a.registeredNotAttendedCount} color={C.red} />
              <StatChip icon={FileWarning} label="Unit Tidak Teridentifikasi" value={a.unidentifiedUnitCount} color={C.slate} />
            </div>
            {a.belowThresholdZoomCount > 0 && (
              <div className="mt-3">
                <StatChip icon={Video} label={`Zoom di Bawah Threshold (<${webinar.metadata.attendanceThresholdMinutes}m)`} value={a.belowThresholdZoomCount} color={C.violet} />
              </div>
            )}
          </div>
          <div>
            <Donut data={comp} />
            <div className="mt-2 space-y-1">
              {comp.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <b>{num(s.value)}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {funnelSteps.length > 1 && (
        <Card className="p-5">
          <SectionTitle icon={ClipboardList}>Funnel Partisipasi</SectionTitle>
          <div className="space-y-1.5">
            {funnelSteps.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-40 shrink-0 text-[11.5px]" style={{ color: C.inkSoft }}>{s.label}</div>
                <div className="relative h-6 flex-1 rounded" style={{ background: C.page }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded"
                    style={{ width: `${((s.value as number) / funnelMax) * 100}%`, background: C.blue }}
                  />
                </div>
                <div className="w-14 shrink-0 text-right text-[12px] font-semibold" style={{ color: C.ink }}>{num(s.value)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
