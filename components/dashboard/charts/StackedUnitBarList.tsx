"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { C, colorForIndex, num } from "@/lib/theme";
import type { CrossWebinarUnitDistribution } from "@/types/analytics";

export interface StackedUnitBarSeries {
  id: string;
  label: string;
}

export function StackedUnitBarList({
  rows,
  series,
  maxHeight = 540,
  footnote,
}: {
  rows: CrossWebinarUnitDistribution[];
  series: StackedUnitBarSeries[];
  maxHeight?: number;
  footnote?: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => rows.filter((r) => r.unit.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.total - a.total),
    [rows, q],
  );
  const max = Math.max(1, ...filtered.map((d) => d.total));
  const sum = filtered.reduce((s, d) => s + d.total, 0);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1" style={{ borderColor: C.line }}>
          <Search size={13} style={{ color: C.slateSoft }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari/saring unit…" className="w-48 text-sm outline-none" />
        </div>
        <span className="text-xs" style={{ color: C.slateSoft }}>{filtered.length} unit · total {num(sum)}</span>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px]" style={{ color: C.slate }}>
          {series.map((s, i) => (
            <span key={s.id} className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorForIndex(i) }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-y-auto rounded-xl" style={{ border: `1px solid ${C.line}`, maxHeight, background: "#FCFDFF" }}>
        {filtered.map((d) => (
          <div
            key={d.unit}
            className="flex items-center gap-2 px-3 py-1"
            style={{ borderBottom: `1px solid ${C.page}` }}
            title={`${d.unit} — total ${d.total} (${series.map((s) => `${s.label}: ${d.webinarCounts[s.id] ?? 0}`).join(", ")})`}
          >
            <div className="shrink-0 text-right text-[11px]" style={{ width: 228, color: C.inkSoft, lineHeight: 1.15 }}>{d.unit}</div>
            <div className="relative h-4 flex-1" style={{ background: "#EEF2F8", borderRadius: 4 }}>
              <div
                className="absolute inset-y-0 left-0 flex overflow-hidden"
                style={{ width: `${(d.total / max) * 100}%`, minWidth: d.total > 0 ? 3 : 0, borderRadius: 4 }}
              >
                {series.map((s, i) => {
                  const value = d.webinarCounts[s.id] ?? 0;
                  if (value <= 0) return null;
                  return <div key={s.id} style={{ width: `${(value / d.total) * 100}%`, background: colorForIndex(i) }} />;
                })}
              </div>
            </div>
            <div className="w-10 shrink-0 text-right text-[11px] font-semibold" style={{ color: C.slate }}>{d.total}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="px-3 py-6 text-center text-[12px]" style={{ color: C.slateSoft }}>Tidak ada unit yang cocok.</div>}
      </div>
      {footnote && <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: C.slateSoft }}>{footnote}</p>}
    </div>
  );
}
