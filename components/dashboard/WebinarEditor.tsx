"use client";

import React, { useMemo, useState } from "react";
import { Search, Trash2, RefreshCw, Save, RotateCcw, PencilLine } from "lucide-react";
import { Card, SectionTitle, SecondaryButton, PrimaryButton, Badge } from "./ui/primitives";
import { ConfirmModal } from "./ui/Modal";
import { maskEmail, maskNip, maskPhone } from "@/lib/privacy";
import { C, num } from "@/lib/theme";
import { KPI_FIELDS, KPI_FIELD_GROUPS } from "@/lib/analytics/kpi-overrides";
import type { Participant, Webinar, WebinarMetadata } from "@/types/webinar";
import type { WebinarMetrics } from "@/types/analytics";

export function WebinarEditor({
  webinar,
  rawMetrics,
  onUpdateMetadata,
  onUpdateParticipants,
  onUpdateKpiOverrides,
  onDelete,
  onReplace,
}: {
  webinar: Webinar;
  rawMetrics: WebinarMetrics;
  onUpdateMetadata: (metadata: WebinarMetadata) => void;
  onUpdateParticipants: (participants: Participant[]) => void;
  onUpdateKpiOverrides: (overrides: Record<string, number>) => void;
  onDelete: () => void;
  onReplace: () => void;
}) {
  const [meta, setMeta] = useState<WebinarMetadata>(webinar.metadata);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>(webinar.kpiOverrides ?? {});
  const [overridesDirty, setOverridesDirty] = useState(false);

  function setOverrideValue(key: string, raw: string) {
    setOverrides((prev) => {
      const next = { ...prev };
      if (raw.trim() === "") {
        delete next[key];
      } else {
        const n = Number(raw);
        if (Number.isNaN(n)) return prev;
        next[key] = n;
      }
      return next;
    });
    setOverridesDirty(true);
  }

  function resetOverride(key: string) {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setOverridesDirty(true);
  }

  function resetAllOverrides() {
    setOverrides({});
    setOverridesDirty(true);
  }

  const filtered = useMemo(
    () => webinar.participants.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.unitFinal.toLowerCase().includes(search.toLowerCase())),
    [webinar.participants, search],
  );

  function updateParticipant(id: string, patch: Partial<Participant>) {
    onUpdateParticipants(webinar.participants.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle
          action={
            dirty ? (
              <span className="flex items-center gap-2">
                <span className="text-[11.5px] font-semibold" style={{ color: C.amber }}>Perubahan belum disimpan</span>
                <PrimaryButton icon={Save} onClick={() => { onUpdateMetadata(meta); setDirty(false); }}>Simpan Metadata</PrimaryButton>
              </span>
            ) : undefined
          }
        >
          Edit Metadata
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <EditField label="Judul" value={meta.title} onChange={(v) => { setMeta({ ...meta, title: v }); setDirty(true); }} />
          <EditField label="Subjudul" value={meta.subtitle} onChange={(v) => { setMeta({ ...meta, subtitle: v }); setDirty(true); }} />
          <EditField label="Tema" value={meta.theme} onChange={(v) => { setMeta({ ...meta, theme: v }); setDirty(true); }} />
          <EditField label="Tanggal" value={meta.date} onChange={(v) => { setMeta({ ...meta, date: v }); setDirty(true); }} />
          <EditField label="Narasumber" value={meta.speaker} onChange={(v) => { setMeta({ ...meta, speaker: v }); setDirty(true); }} />
          <EditField label="Nama Seri" value={meta.seriesName} onChange={(v) => { setMeta({ ...meta, seriesName: v }); setDirty(true); }} />
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle hint={`${filtered.length} dari ${webinar.participants.length} peserta`}>Koreksi Data Peserta</SectionTitle>
        <div className="mb-2 flex items-center gap-1.5 rounded-lg border px-2 py-1" style={{ borderColor: C.line, width: 260 }}>
          <Search size={13} style={{ color: C.slateSoft }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/unit…" className="w-full text-sm outline-none" />
        </div>
        <div className="max-h-96 overflow-auto rounded-xl" style={{ border: `1px solid ${C.line}` }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                <th className="px-2 py-1.5 text-left" style={{ color: C.slate }}>Nama</th>
                <th className="px-2 py-1.5 text-left" style={{ color: C.slate }}>Unit</th>
                <th className="px-2 py-1.5 text-left" style={{ color: C.slate }}>Email</th>
                <th className="px-2 py-1.5 text-left" style={{ color: C.slate }}>NIP</th>
                <th className="px-2 py-1.5 text-left" style={{ color: C.slate }}>HP</th>
                <th className="px-2 py-1.5 text-center" style={{ color: C.slate }}>Exclude</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${C.page}`, opacity: p.excluded ? 0.5 : 1 }}>
                  <td className="px-2 py-1">{p.name}</td>
                  <td className="px-2 py-1">
                    <input
                      value={p.unitFinal}
                      onChange={(e) => updateParticipant(p.id, { unitFinal: e.target.value })}
                      className="w-40 rounded border px-1.5 py-0.5"
                      style={{ borderColor: C.blueSoft, background: "#F0F7FF" }}
                    />
                  </td>
                  <td className="px-2 py-1">{maskEmail(p.email)}</td>
                  <td className="px-2 py-1">{maskNip(p.nip)}</td>
                  <td className="px-2 py-1">{maskPhone(p.phone)}</td>
                  <td className="px-2 py-1 text-center">
                    <input type="checkbox" checked={p.excluded} onChange={(e) => updateParticipant(p.id, { excluded: e.target.checked, exclusionReason: e.target.checked ? "Dikecualikan manual oleh admin" : null })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle
          icon={PencilLine}
          hint="setiap angka boleh diganti manual, kosongkan untuk kembali ke hasil hitung otomatis"
          action={
            <span className="flex items-center gap-2">
              {overridesDirty && <span className="text-[11.5px] font-semibold" style={{ color: C.amber }}>Perubahan belum disimpan</span>}
              <SecondaryButton icon={RotateCcw} onClick={resetAllOverrides}>Kembalikan Semua ke Otomatis</SecondaryButton>
              <PrimaryButton icon={Save} onClick={() => { onUpdateKpiOverrides(overrides); setOverridesDirty(false); }}>Simpan Angka</PrimaryButton>
            </span>
          }
        >
          Koreksi Angka KPI (Override Manual)
        </SectionTitle>
        <div className="space-y-4">
          {KPI_FIELD_GROUPS.map((group) => (
            <div key={group}>
              <h4 className="mb-1.5 text-[11.5px] font-bold uppercase tracking-wide" style={{ color: C.slate }}>{group}</h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {KPI_FIELDS.filter((f) => f.group === group).map((field) => {
                  const computed = field.get(rawMetrics);
                  const isOverridden = Object.prototype.hasOwnProperty.call(overrides, field.key);
                  return (
                    <label key={field.key} className="block rounded-lg border px-2.5 py-1.5" style={{ borderColor: isOverridden ? C.amber + "66" : C.line, background: isOverridden ? C.amber + "0C" : "white" }}>
                      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: C.slate }}>
                        {field.label}
                        {isOverridden && <Badge tone="amber">Manual</Badge>}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={isOverridden ? overrides[field.key] : ""}
                          placeholder={computed === null ? "-" : String(computed)}
                          onChange={(e) => setOverrideValue(field.key, e.target.value)}
                          className="w-full rounded border px-1.5 py-1 text-[13px]"
                          style={{ borderColor: C.line }}
                        />
                        {field.suffix && <span className="text-[11px]" style={{ color: C.slateSoft }}>{field.suffix}</span>}
                        {isOverridden && (
                          <button type="button" onClick={() => resetOverride(field.key)} title="Kembalikan ke hitung otomatis" className="shrink-0">
                            <RotateCcw size={13} style={{ color: C.slateSoft }} />
                          </button>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Tindakan Webinar</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton icon={RefreshCw} onClick={onReplace}>Ganti File Excel</SecondaryButton>
          <SecondaryButton icon={Trash2} tone="red" onClick={() => setConfirmDelete(true)}>Hapus Webinar Ini</SecondaryButton>
        </div>
      </Card>

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Hapus Webinar #${webinar.number}?`}
        description={`Seluruh ${num(webinar.participants.length)} baris peserta pada "${webinar.metadata.title}" akan dihapus dari penyimpanan lokal. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Webinar"
        danger
        onConfirm={onDelete}
      />
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold" style={{ color: C.slate }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </label>
  );
}
