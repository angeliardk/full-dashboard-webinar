"use client";

import React, { useMemo, useState } from "react";
import { HelpCircle, Search } from "lucide-react";
import { Card, SectionTitle, StatChip, EmptyState } from "./ui/primitives";
import { C, pct } from "@/lib/theme";
import type { Webinar } from "@/types/webinar";
import type { QuestionActivityMetrics } from "@/types/analytics";

export function QuestionsSection({ webinar, metrics }: { webinar: Webinar; metrics: QuestionActivityMetrics | null }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => webinar.questions.filter((q) => q.question.toLowerCase().includes(search.toLowerCase()) || (q.askerName ?? "").toLowerCase().includes(search.toLowerCase())),
    [webinar.questions, search],
  );

  if (!metrics || webinar.questions.length === 0) {
    return (
      <Card className="p-5">
        <SectionTitle icon={HelpCircle}>Pertanyaan Peserta</SectionTitle>
        <EmptyState title="Data pertanyaan tidak tersedia" hint="Tidak ada sheet Questions pada file yang diunggah untuk webinar ini." />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <SectionTitle icon={HelpCircle} hint={`${metrics.questionCount} pertanyaan dari ${metrics.askerCount} penanya`}>
        Pertanyaan Peserta
      </SectionTitle>
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip label="Jumlah Pertanyaan" value={metrics.questionCount} color={C.blue} />
        <StatChip label="Jumlah Penanya" value={metrics.askerCount} color={C.violet} />
        <StatChip
          label="Tingkat Keaktifan"
          value={metrics.askerCount ? Math.round((metrics.questionCount / metrics.askerCount) * 100) / 100 : 0}
          color={C.green}
          sub="pertanyaan/penanya"
        />
        <StatChip
          label="% Peserta Bertanya"
          value={metrics.askerPercentOfAttendees != null ? pct(metrics.askerPercentOfAttendees) : "-"}
          color={C.amber}
          sub="dari peserta hadir valid"
        />
      </div>
      <div className="mb-2 flex items-center gap-1.5 rounded-lg border px-2 py-1" style={{ borderColor: C.line, width: 260 }}>
        <Search size={13} style={{ color: C.slateSoft }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pertanyaan/penanya…" className="w-full text-sm outline-none" />
      </div>
      <div className="max-h-96 overflow-y-auto rounded-xl" style={{ border: `1px solid ${C.line}` }}>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              <th className="px-3 py-2 text-left" style={{ color: C.slate }}>Waktu</th>
              <th className="px-3 py-2 text-left" style={{ color: C.slate }}>Penanya</th>
              <th className="px-3 py-2 text-left" style={{ color: C.slate }}>Unit</th>
              <th className="px-3 py-2 text-left" style={{ color: C.slate }}>Pertanyaan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <tr key={q.id} style={{ borderBottom: `1px solid ${C.page}` }}>
                <td className="whitespace-nowrap px-3 py-2 align-top" style={{ color: C.slateSoft }}>{q.time ?? "-"}</td>
                <td className="whitespace-nowrap px-3 py-2 align-top font-medium" style={{ color: C.ink }}>{q.askerName ?? "-"}</td>
                <td className="whitespace-nowrap px-3 py-2 align-top" style={{ color: C.inkSoft }}>{q.unit ?? "-"}</td>
                <td className="px-3 py-2 align-top" style={{ color: C.inkSoft }}>{q.question}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="Tidak ada pertanyaan yang cocok." />}
      </div>
    </Card>
  );
}
