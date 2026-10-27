"use client";

import React, { useMemo, useState } from "react";
import { MessageSquare, Search, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, SectionTitle, EmptyState } from "./ui/primitives";
import { C, colorForIndex, num } from "@/lib/theme";
import type { WebinarMetrics } from "@/types/analytics";

const FEEDBACK_LABEL_CHARS_PER_LINE = 42;
const FEEDBACK_LABEL_LINE_HEIGHT = 13;

/** Breaks a question into lines of at most `maxChars`, only at word boundaries. */
function wrapLabel(text: string, maxChars = FEEDBACK_LABEL_CHARS_PER_LINE): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function FeedbackYAxisTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const lines = wrapLabel(String(payload?.value ?? ""));
  const offset = -((lines.length - 1) * FEEDBACK_LABEL_LINE_HEIGHT) / 2;
  return (
    <text x={x} y={y} textAnchor="end" fontSize={11} fill={C.inkSoft}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? offset + 4 : FEEDBACK_LABEL_LINE_HEIGHT}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function FeedbackSection({ metrics }: { metrics: WebinarMetrics }) {
  const f = metrics.feedback;
  const [questionFilter, setQuestionFilter] = useState<string>("Semua");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const likert = f.questionMetrics.filter((q) => q.type === "likert");
  const chartData = likert.map((q) => ({ name: q.question, avg: q.average, n: q.responseCount }));
  const maxLabelLines = chartData.reduce((max, d) => Math.max(max, wrapLabel(d.name).length), 1);
  const chartRowHeight = Math.max(36, maxLabelLines * FEEDBACK_LABEL_LINE_HEIGHT + 18);

  const questionOptions = ["Semua", ...new Set(f.textComments.map((c) => c.question))];
  const filteredComments = useMemo(() => {
    return f.textComments.filter((c) => {
      if (questionFilter !== "Semua" && c.question !== questionFilter) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (search && !c.text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [f.textComments, questionFilter, categoryFilter, search]);

  if (f.responseCount === 0) {
    return (
      <Card className="p-5">
        <SectionTitle icon={MessageSquare}>Feedback Peserta</SectionTitle>
        <EmptyState title="Data feedback tidak tersedia" hint="Tidak ada peserta yang mengisi feedback pada webinar ini." />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {likert.length > 0 && (
        <Card className="p-5">
          <SectionTitle icon={MessageSquare} hint={`rata-rata per pertanyaan · ${f.distinctRespondentCount} responden`}>
            Rata-rata Feedback per Pertanyaan
          </SectionTitle>
          <ResponsiveContainer width="100%" height={Math.max(180, likert.length * chartRowHeight)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} stroke={C.line} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={300} tick={<FeedbackYAxisTick />} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12, maxWidth: 320 }}
                labelFormatter={(label) => String(label)}
                formatter={(v) => Number(v ?? 0).toFixed(2)}
              />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={colorForIndex(i)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {f.categoryDistribution.length > 0 && (
        <Card className="p-5">
          <SectionTitle
            icon={MessageSquare}
            hint={categoryFilter ? `menampilkan "${categoryFilter}" di Komentar Terbuka` : "klik kategori untuk melihat contoh komentarnya"}
          >
            Distribusi Kategori Feedback
          </SectionTitle>
          <div className="flex flex-wrap gap-2">
            {f.categoryDistribution.map((c) => {
              const active = categoryFilter === c.category;
              return (
                <button
                  key={c.category}
                  type="button"
                  onClick={() => setCategoryFilter(active ? null : c.category)}
                  className="rounded-full px-3 py-1 text-[12px] font-semibold transition"
                  style={
                    active
                      ? { background: C.blue, color: "white" }
                      : { background: C.blue + "12", color: C.blue }
                  }
                >
                  {c.category} · {num(c.count)}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {f.textComments.length > 0 && (
        <Card className="p-5">
          <SectionTitle icon={MessageSquare} hint={`${filteredComments.length} komentar`}>Komentar Terbuka</SectionTitle>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={questionFilter}
              onChange={(e) => setQuestionFilter(e.target.value)}
              className="rounded-lg border px-2 py-1.5 text-[12.5px]"
              style={{ borderColor: C.line }}
            >
              {questionOptions.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
            <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1" style={{ borderColor: C.line }}>
              <Search size={13} style={{ color: C.slateSoft }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari komentar…" className="w-48 text-sm outline-none" />
            </div>
            {categoryFilter && (
              <button
                type="button"
                onClick={() => setCategoryFilter(null)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                style={{ background: C.blue, color: "white" }}
              >
                Kategori: {categoryFilter} <X size={12} />
              </button>
            )}
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {filteredComments.map((c) => (
              <div key={c.id} className="rounded-xl px-3 py-2" style={{ background: C.page }}>
                <div className="mb-1 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: C.slateSoft }}>
                  <span>{c.question}</span>
                  {c.category && <span className="rounded-full px-1.5 py-0.5" style={{ background: C.blue + "14", color: C.blue }}>{c.category}</span>}
                </div>
                <p className="text-[13px]" style={{ color: C.inkSoft }}>{c.text}</p>
              </div>
            ))}
            {filteredComments.length === 0 && <EmptyState title="Tidak ada komentar yang cocok." />}
          </div>
        </Card>
      )}
    </div>
  );
}
