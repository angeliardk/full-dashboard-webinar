"use client";

import React, { useState } from "react";
import { ShieldAlert, FileWarning } from "lucide-react";
import { Card, SectionTitle, StatChip, IssueList, EmptyState } from "./ui/primitives";
import { C } from "@/lib/theme";
import { maskRawRow } from "@/lib/privacy";
import type { Webinar } from "@/types/webinar";

function AuditTable({ rows, title }: { rows: Record<string, unknown>[]; title: string }) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;
  const masked = rows.map(maskRawRow);
  const columns = Object.keys(masked[0] ?? {}).slice(0, 8);
  return (
    <div className="rounded-xl" style={{ border: `1px solid ${C.line}` }}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2 text-[13px] font-semibold" style={{ color: C.ink }}>
        {title} ({rows.length})
        <span style={{ color: C.slateSoft }}>{open ? "Sembunyikan" : "Tampilkan"}</span>
      </button>
      {open && (
        <div className="max-h-72 overflow-auto border-t" style={{ borderColor: C.line }}>
          <table className="w-full text-[11.5px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {columns.map((c) => <th key={c} className="whitespace-nowrap px-2 py-1.5 text-left" style={{ color: C.slate }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {masked.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.page}` }}>
                  {columns.map((c) => <td key={c} className="whitespace-nowrap px-2 py-1" style={{ color: C.inkSoft }}>{String(r[c] ?? "-")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function DataQualitySection({ webinar }: { webinar: Webinar }) {
  const info = webinar.importInfo;
  const errors = info.issues.filter((i) => i.level === "error").length;
  const warnings = info.issues.filter((i) => i.level === "warning").length;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle icon={ShieldAlert} hint={`sumber: ${info.sourceFileName ?? "-"}`}>Status Kualitas Data</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip label="Baris Mentah" value={info.rawRowCount} color={C.slate} />
          <StatChip label="Peserta Valid" value={info.validRowCount} color={C.green} />
          <StatChip label="Duplikat" value={info.duplicateRowCount} color={C.amber} />
          <StatChip label="Error / Warning" value={`${errors} / ${warnings}`} color={errors > 0 ? C.red : C.amber} />
        </div>
        {info.reconstructed && (
          <p className="mt-3 rounded-lg px-3 py-2 text-[12px]" style={{ background: C.violet + "0E", color: C.inkSoft }}>
            Data webinar ini direkonstruksi dari dashboard versi lama (bukan hasil upload Excel langsung). Lihat catatan di bawah untuk detail asumsi yang dipakai.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle icon={FileWarning}>Catatan Validasi Import</SectionTitle>
        <IssueList issues={info.issues} />
      </Card>

      {(info.reconstructionNotes?.length ?? 0) > 0 && (
        <Card className="p-5">
          <SectionTitle icon={FileWarning}>Catatan Rekonstruksi Data Lama</SectionTitle>
          <ul className="list-disc space-y-1.5 pl-4 text-[12.5px]" style={{ color: C.inkSoft }}>
            {info.reconstructionNotes!.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </Card>
      )}

      <Card className="p-5">
        <SectionTitle icon={FileWarning} hint="email/NIP/nomor HP disamarkan">Audit Sumber Data</SectionTitle>
        <div className="space-y-2">
          <AuditTable rows={info.duplicatesDiscarded.map((r) => r.raw)} title="Baris Duplikat yang Dibuang" />
          <AuditTable rows={info.unmatchedPre.map((r) => r.raw)} title="Pre-Test Tidak Match (Unmatched PRE)" />
          <AuditTable rows={info.unmatchedPost.map((r) => r.raw)} title="Post-Test Tidak Match" />
          <AuditTable rows={info.preDedupRows} title="PRE Dedup (referensi)" />
          <AuditTable rows={info.postDedupRows} title="POST Feedback Dedup (referensi)" />
          <AuditTable rows={info.unitSummaryCrossCheck} title="Ringkasan Unit (cross-check)" />
        </div>
        {info.duplicatesDiscarded.length === 0 &&
          info.unmatchedPre.length === 0 &&
          info.unmatchedPost.length === 0 &&
          info.preDedupRows.length === 0 &&
          info.postDedupRows.length === 0 &&
          info.unitSummaryCrossCheck.length === 0 && <EmptyState title="Tidak ada data audit tambahan untuk webinar ini." />}
      </Card>
    </div>
  );
}
