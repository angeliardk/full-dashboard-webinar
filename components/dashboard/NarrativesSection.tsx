"use client";

import React from "react";
import { Lightbulb, Sparkles, Wrench, BookOpen, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Card, SectionTitle } from "./ui/primitives";
import { C } from "@/lib/theme";
import type { NarrativeItem, NarrativeType, WebinarNarratives } from "@/types/webinar";

const SECTIONS: { type: NarrativeType; label: string; icon: typeof Lightbulb; accent: string }[] = [
  { type: "finding", label: "Temuan Utama", icon: Lightbulb, accent: C.blue },
  { type: "strength", label: "Kekuatan", icon: Sparkles, accent: C.green },
  { type: "improvement", label: "Area Perbaikan", icon: Wrench, accent: C.amber },
  { type: "recommendation", label: "Rekomendasi", icon: BookOpen, accent: C.violet },
  { type: "limitation", label: "Keterbatasan Data", icon: AlertTriangle, accent: C.red },
];

function EditableNarrativeList({
  items,
  accent,
  editMode,
  onChange,
}: {
  items: NarrativeItem[];
  accent: string;
  editMode: boolean;
  onChange: (items: NarrativeItem[]) => void;
}) {
  if (items.length === 0 && !editMode) {
    return <p className="text-[12.5px]" style={{ color: C.slateSoft }}>Belum ada data.</p>;
  }
  return (
    <ul className="space-y-2 text-[12.5px]" style={{ color: C.inkSoft }}>
      {items.map((it, i) => (
        <li key={it.id} className="flex gap-2">
          <b style={{ color: accent, flexShrink: 0 }}>›</b>
          {editMode ? (
            <div className="flex flex-1 items-start gap-1">
              <textarea
                value={it.text}
                onChange={(e) => {
                  const next = items.slice();
                  next[i] = { ...it, text: e.target.value, edited: true };
                  onChange(next);
                }}
                rows={2}
                className="flex-1 rounded border px-2 py-1 text-[12.5px]"
                style={{ borderColor: C.blueSoft, background: "#F0F7FF" }}
              />
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="mt-1 rounded p-1" style={{ color: C.red }}>
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <span>{it.text}</span>
          )}
        </li>
      ))}
      {editMode && (
        <li>
          <button
            onClick={() => onChange([...items, { id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: "Poin baru…", order: items.length, edited: true }])}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold"
            style={{ color: accent, background: accent + "14" }}
          >
            <Plus size={13} />Tambah poin
          </button>
        </li>
      )}
    </ul>
  );
}

export function NarrativesSection({
  narratives,
  editMode,
  onChange,
}: {
  narratives: WebinarNarratives;
  editMode: boolean;
  onChange: (narratives: WebinarNarratives) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {SECTIONS.map(({ type, label, icon, accent }) => (
        <Card key={type} className="p-5">
          <SectionTitle icon={icon}>{label}</SectionTitle>
          <EditableNarrativeList
            items={narratives[type]}
            accent={accent}
            editMode={editMode}
            onChange={(items) => onChange({ ...narratives, [type]: items })}
          />
        </Card>
      ))}
    </div>
  );
}
