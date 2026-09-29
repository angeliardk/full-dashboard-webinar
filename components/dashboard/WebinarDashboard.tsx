"use client";

import React, { useState } from "react";
import { Calendar, Mic, Database, ShieldCheck, Users, UserCheck, GraduationCap, MessageSquare, TrendingUp } from "lucide-react";
import { Card, Kpi, Badge } from "./ui/primitives";
import { AttendanceSection } from "./AttendanceSection";
import { LearningSection } from "./LearningSection";
import { FeedbackSection } from "./FeedbackSection";
import { QuestionsSection } from "./QuestionsSection";
import { UnitDistributionSection } from "./UnitDistributionSection";
import { DataQualitySection } from "./DataQualitySection";
import { NarrativesSection } from "./NarrativesSection";
import { WebinarEditor } from "./WebinarEditor";
import { C, num } from "@/lib/theme";
import type { Participant, Webinar, WebinarMetadata, WebinarNarratives } from "@/types/webinar";
import type { WebinarMetrics } from "@/types/analytics";

const BASE_SUB_TABS = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "kehadiran", label: "Kehadiran" },
  { id: "pembelajaran", label: "Pembelajaran" },
  { id: "feedback", label: "Feedback" },
  { id: "pertanyaan", label: "Pertanyaan" },
  { id: "unit", label: "Unit & Demografi" },
  { id: "temuan", label: "Temuan & Rekomendasi" },
  { id: "kualitas", label: "Kualitas Data" },
] as const;

export function WebinarDashboard({
  webinar,
  metrics,
  rawMetrics,
  overriddenKeys,
  editMode,
  readOnly = false,
  onUpdateNarratives,
  onUpdateMetadata,
  onUpdateParticipants,
  onUpdateKpiOverrides,
  onDeleteWebinar,
  onReplaceWebinar,
}: {
  webinar: Webinar;
  metrics: WebinarMetrics;
  rawMetrics: WebinarMetrics;
  overriddenKeys: Set<string>;
  editMode: boolean;
  /** True for a webinar published from another browser — no local participant data to edit here. */
  readOnly?: boolean;
  onUpdateNarratives: (narratives: WebinarNarratives) => void;
  onUpdateMetadata: (metadata: WebinarMetadata) => void;
  onUpdateParticipants: (participants: Participant[]) => void;
  onUpdateKpiOverrides: (overrides: Record<string, number>) => void;
  onDeleteWebinar: () => void;
  onReplaceWebinar: () => void;
}) {
  const canEdit = editMode && !readOnly;
  const SUB_TABS = canEdit ? [...BASE_SUB_TABS, { id: "admin", label: "Admin" } as const] : BASE_SUB_TABS;
  const [sub, setSub] = useState<string>("ringkasan");
  const hasIssues = webinar.importInfo.issues.some((i) => i.level === "error");
  const hasWarnings = webinar.importInfo.issues.some((i) => i.level === "warning");

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg px-2.5 py-1 text-[12px] font-bold text-white" style={{ background: C.blue }}>Webinar #{webinar.number}</span>
              {hasIssues ? <Badge tone="red">Ada error validasi</Badge> : hasWarnings ? <Badge tone="amber">Ada catatan warning</Badge> : <Badge tone="green">Data valid</Badge>}
              {webinar.importInfo.reconstructed && <Badge tone="slate">Data rekonstruksi</Badge>}
              {readOnly && <Badge tone="blue">Dibagikan dari perangkat lain</Badge>}
            </div>
            {readOnly && (
              <p className="mt-2 max-w-2xl rounded-lg px-2.5 py-1.5 text-[11.5px]" style={{ background: C.blue + "0D", color: C.inkSoft }}>
                Webinar ini diunggah &amp; dipublikasikan dari perangkat lain. Untuk mengedit angka, metadata, atau
                catatannya, buka Mode Edit di perangkat yang punya file Excel aslinya.
              </p>
            )}
            <h2 className="mt-2 text-lg font-bold" style={{ color: C.ink }}>{webinar.metadata.title}</h2>
            {webinar.metadata.subtitle && <p className="mt-0.5 max-w-2xl text-[12.5px]" style={{ color: C.slate }}>{webinar.metadata.subtitle}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]" style={{ color: C.slateSoft }}>
              <span className="flex items-center gap-1"><Calendar size={13} />{webinar.metadata.date}</span>
              {webinar.metadata.speaker && <span className="flex items-center gap-1"><Mic size={13} />{webinar.metadata.speaker}</span>}
              <span className="flex items-center gap-1"><Database size={13} />{webinar.metadata.sourceName || "-"}</span>
              <span className="flex items-center gap-1"><ShieldCheck size={13} />Kehadiran valid: Zoom &gt;{webinar.metadata.attendanceThresholdMinutes} menit</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        <Kpi label="Peserta Database" value={metrics.attendance.databaseParticipantCount} accent={C.slate} overridden={overriddenKeys.has("attendance.databaseParticipantCount")} />
        <Kpi label="Registrasi" value={metrics.attendance.registeredCount} accent={C.cyan} overridden={overriddenKeys.has("attendance.registeredCount")} />
        <Kpi label="Hadir Zoom (>=5m)" value={metrics.attendance.zoomPresentCount} accent={C.violet} overridden={overriddenKeys.has("attendance.zoomPresentCount")} />
        <Kpi label="Hadir Zoom Valid" value={metrics.attendance.zoomValidAttendeeCount} accent={C.blue} overridden={overriddenKeys.has("attendance.zoomValidAttendeeCount")} />
        <Kpi label="Pre-Test" value={metrics.learning.preRespondentCount} accent={C.violet} overridden={overriddenKeys.has("learning.preRespondentCount")} />
        <Kpi label="Post-Test" value={metrics.learning.postRespondentCount} accent={C.green} overridden={overriddenKeys.has("learning.postRespondentCount")} />
        <Kpi label="Pasangan Pre-Post" value={metrics.learning.pairedCount} accent={C.amber} overridden={overriddenKeys.has("learning.pairedCount")} />
        <Kpi label="Feedback" value={metrics.feedback.distinctRespondentCount} accent={C.blue} overridden={overriddenKeys.has("feedback.distinctRespondentCount")} />
        <Kpi label="Rata-rata Kenaikan" value={metrics.learning.pairedGainAverage ?? "-"} accent={C.green} overridden={overriddenKeys.has("learning.pairedGainAverage")} />
      </div>

      <nav className="flex flex-wrap gap-1 rounded-xl bg-white p-1" style={{ border: `1px solid ${C.line}` }}>
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition"
            style={{ background: sub === t.id ? C.blue : "transparent", color: sub === t.id ? "white" : C.inkSoft }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {sub === "ringkasan" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-2 flex items-center gap-2 text-[15px] font-semibold" style={{ color: C.ink }}><Users size={17} style={{ color: C.blue }} />Kehadiran Singkat</h3>
            <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
              {`${num(metrics.attendance.zoomPresentCount)} peserta hadir (≥5 menit) dan ${num(
                metrics.attendance.zoomValidAttendeeCount,
              )} di antaranya hadir valid (>${webinar.metadata.attendanceThresholdMinutes} menit) dari ${num(
                metrics.attendance.registeredCount,
              )} registrasi (${num(metrics.attendance.registeredAndAttendedCount)} keduanya, ${num(
                metrics.attendance.attendedWithoutRegistrationCount,
              )} hadir tanpa registrasi).`}
            </p>
          </Card>
          <Card className="p-5">
            <h3 className="mb-2 flex items-center gap-2 text-[15px] font-semibold" style={{ color: C.ink }}><GraduationCap size={17} style={{ color: C.green }} />Pembelajaran Singkat</h3>
            <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
              Rata-rata pre {metrics.learning.preAverage ?? "-"} → post {metrics.learning.postAverage ?? "-"}
              ({metrics.learning.improvedCount} meningkat, {metrics.learning.sameCount} tetap, {metrics.learning.declinedCount} menurun dari {metrics.learning.pairedCount} pasangan).
            </p>
          </Card>
          <Card className="p-5">
            <h3 className="mb-2 flex items-center gap-2 text-[15px] font-semibold" style={{ color: C.ink }}><MessageSquare size={17} style={{ color: C.violet }} />Feedback Singkat</h3>
            <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
              {metrics.feedback.distinctRespondentCount} responden feedback, {metrics.feedback.questionMetrics.filter((q) => q.type === "likert").length} pertanyaan Likert.
            </p>
          </Card>
          <Card className="p-5">
            <h3 className="mb-2 flex items-center gap-2 text-[15px] font-semibold" style={{ color: C.ink }}><TrendingUp size={17} style={{ color: C.amber }} />Completion Rate</h3>
            <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
              Pre {metrics.completion.preRate ?? "-"}% · Post {metrics.completion.postRate ?? "-"}% · Feedback {metrics.completion.feedbackRate ?? "-"}% (dari peserta hadir valid).
            </p>
          </Card>
        </div>
      )}
      {sub === "kehadiran" && <AttendanceSection webinar={webinar} metrics={metrics} />}
      {sub === "pembelajaran" && <LearningSection metrics={metrics} />}
      {sub === "feedback" && <FeedbackSection metrics={metrics} />}
      {sub === "pertanyaan" && <QuestionsSection webinar={webinar} metrics={metrics.questions} />}
      {sub === "unit" && <UnitDistributionSection units={metrics.units} />}
      {sub === "temuan" && <NarrativesSection narratives={webinar.narratives} editMode={canEdit} onChange={onUpdateNarratives} />}
      {sub === "kualitas" && <DataQualitySection webinar={webinar} />}
      {sub === "admin" && canEdit && (
        <WebinarEditor
          webinar={webinar}
          rawMetrics={rawMetrics}
          onUpdateMetadata={onUpdateMetadata}
          onUpdateParticipants={onUpdateParticipants}
          onUpdateKpiOverrides={onUpdateKpiOverrides}
          onDelete={onDeleteWebinar}
          onReplace={onReplaceWebinar}
        />
      )}
    </div>
  );
}
