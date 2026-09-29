"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { C, num, tnum } from "@/lib/theme";
import type { UnitDistributionRow } from "@/types/analytics";

export function UnitBarList({ rows, maxHeight = 480 }: { rows: UnitDistributionRow[]; maxHeight?: number }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => rows.filter((r) => r.unit.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.count - a.count),
    [rows, q],
  );
  const max = Math.max(1, ...filtered.map((d) => d.count));
  const sum = filtered.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1" style={{ borderColor: C.line }}>
          <Search size={13} style={{ color: C.slateSoft }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari/saring unit…" className="w-48 text-sm outline-none" />
        </div>
        <span className="text-xs" style={{ color: C.slateSoft }}>{filtered.length} unit · total {num(sum)}</span>
      </div>
      <div className="overflow-y-auto rounded-xl" style={{ border: `1px solid ${C.line}`, maxHeight, background: "#FCFDFF" }}>
        {filtered.map((d) => (
          <div key={d.unit} className="flex items-center gap-2 px-3 py-1" style={{ borderBottom: `1px solid ${C.page}` }} title={`${d.unit} — ${d.count}`}>
            <div className="shrink-0 text-right text-[11px]" style={{ width: 220, color: C.inkSoft, lineHeight: 1.15 }}>{d.unit}</div>
            <div className="relative h-4 flex-1" style={{ background: "#EEF2F8", borderRadius: 4 }}>
              <div
                className="absolute inset-y-0 left-0"
                style={{ width: `${(d.count / max) * 100}%`, minWidth: d.count > 0 ? 3 : 0, borderRadius: 4, background: C.blue }}
              />
            </div>
            <div className="w-10 shrink-0 text-right text-[11px] font-semibold" style={{ color: C.slate, ...tnum }}>{d.count}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-[12px]" style={{ color: C.slateSoft }}>Tidak ada unit yang cocok.</div>
        )}
      </div>
    </div>
  );
}
