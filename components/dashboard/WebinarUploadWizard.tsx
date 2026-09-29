"use client";

import React, { useMemo, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, ChevronRight, ChevronLeft, Check, Download } from "lucide-react";
import { Modal } from "./ui/Modal";
import { PrimaryButton, SecondaryButton, IssueList, Card, StatChip } from "./ui/primitives";
import { parseWebinarExcelFile } from "@/lib/excel/parse-workbook";
import { downloadTemplateWorkbook } from "@/lib/excel/template-generator";
import {
  buildWebinarFromParsed,
  computeReplaceDiff,
  defaultMetadataForm,
  formFromWebinar,
  mergeParsedMetadataIntoForm,
  validateMetadataForm,
} from "@/lib/wizard/build-webinar";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import { maskEmail, maskPhone, maskNip } from "@/lib/privacy";
import { C, num } from "@/lib/theme";
import type { Webinar } from "@/types/webinar";
import type { ParsedWorkbookResult, WizardMetadataForm } from "@/types/import";

const STEPS = ["Metadata", "Upload Excel", "Validasi", "Preview", "Simpan"];

export function WebinarUploadWizard({
  open,
  onClose,
  existingWebinars,
  onSaved,
  replaceTarget,
}: {
  open: boolean;
  onClose: () => void;
  existingWebinars: Webinar[];
  onSaved: (webinar: Webinar) => Promise<void>;
  replaceTarget?: Webinar | null;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardMetadataForm>(() => (replaceTarget ? formFromWebinar(replaceTarget) : defaultMetadataForm(existingWebinars)));
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedWorkbookResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const metadataIssues = validateMetadataForm(form);
  const existingMatch = existingWebinars.find((w) => w.id === form.id.trim());

  const previewWebinar = useMemo(() => {
    if (!parsed || !file) return null;
    return buildWebinarFromParsed(parsed, form, file.name);
  }, [parsed, form, file]);

  const previewMetrics = useMemo(() => (previewWebinar ? calculateWebinarMetrics(previewWebinar) : null), [previewWebinar]);
  const replaceDiff = useMemo(
    () => (existingMatch && previewWebinar ? computeReplaceDiff(existingMatch, previewWebinar) : null),
    [existingMatch, previewWebinar],
  );

  const errorCount = parsed?.issues.filter((i) => i.level === "error").length ?? 0;
  const warningCount = parsed?.issues.filter((i) => i.level === "warning").length ?? 0;
  const canProceedFromValidation = parsed != null && errorCount === 0 && (warningCount === 0 || acknowledgedWarnings);

  function reset() {
    setStep(0);
    setForm(replaceTarget ? formFromWebinar(replaceTarget) : defaultMetadataForm(existingWebinars));
    setFile(null);
    setParsed(null);
    setParseError(null);
    setAcknowledgedWarnings(false);
    setSaving(false);
  }

  React.useEffect(() => {
    if (open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, replaceTarget]);

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(f: File) {
    setFile(f);
    setParsing(true);
    setParseError(null);
    try {
      const result = await parseWebinarExcelFile(f, { attendanceThresholdMinutes: Number(form.attendanceThresholdMinutes) || 30 });
      setParsed(result);
      setForm((prev) => mergeParsedMetadataIntoForm(prev, result));
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Gagal membaca file Excel.");
      setParsed(null);
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!previewWebinar) return;
    setSaving(true);
    try {
      await onSaved(previewWebinar);
      handleClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      title={replaceTarget ? `Ganti File Excel — Webinar #${replaceTarget.number}` : "Tambah Webinar"}
      description={replaceTarget ? "Unggah file baru untuk menggantikan data webinar ini." : "Impor data webinar baru tanpa mengubah kode sumber."}
      widthClassName="max-w-3xl"
    >
      <div className="mb-4 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-1.5">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: i <= step ? C.blue : C.page, color: i <= step ? "white" : C.slateSoft }}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </span>
              <span className="text-[12px] font-semibold" style={{ color: i === step ? C.ink : C.slateSoft }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="mx-1.5 h-px flex-1" style={{ background: C.line }} />}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nomor Webinar">
              <input
                type="number"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: Number(e.target.value), id: form.id === `w${form.number}` ? `w${e.target.value}` : form.id })}
                className="input"
              />
            </Field>
            <Field label="ID Webinar">
              <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="input" />
            </Field>
          </div>
          <Field label="Judul"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" /></Field>
          <Field label="Subjudul"><input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tema"><input value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} className="input" /></Field>
            <Field label="Tanggal & Waktu"><input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="2026-08-20 13:30" className="input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Narasumber (opsional)"><input value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} className="input" /></Field>
            <Field label="Nama Seri"><input value={form.seriesName} onChange={(e) => setForm({ ...form, seriesName: e.target.value })} className="input" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sumber Data"><input value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} className="input" /></Field>
            <Field label="Populasi Pegawai"><input type="number" value={form.population} onChange={(e) => setForm({ ...form, population: e.target.value })} className="input" /></Field>
            <Field label="Threshold Zoom (menit)"><input type="number" value={form.attendanceThresholdMinutes} onChange={(e) => setForm({ ...form, attendanceThresholdMinutes: e.target.value })} className="input" /></Field>
          </div>
          {metadataIssues.length > 0 && <IssueList issues={metadataIssues} />}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <SecondaryButton icon={Download} onClick={() => downloadTemplateWorkbook()}>Download Template Excel</SecondaryButton>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center"
            style={{ borderColor: dragOver ? C.blue : C.line, background: dragOver ? C.blue + "0A" : C.page }}
          >
            <UploadCloud size={28} style={{ color: C.blue }} />
            <p className="text-[13px] font-semibold" style={{ color: C.ink }}>Seret file .xlsx ke sini atau klik untuk memilih</p>
            <p className="text-[11.5px]" style={{ color: C.slateSoft }}>Diproses sepenuhnya di browser Anda — tidak diunggah ke server manapun.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
          {parsing && <p className="text-[13px]" style={{ color: C.blue }}>Membaca & memvalidasi file…</p>}
          {parseError && <p className="text-[13px]" style={{ color: C.red }}>{parseError}</p>}
          {file && !parsing && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px]" style={{ background: C.green + "0E", color: C.green }}>
              <FileSpreadsheet size={16} /> {file.name} — {parsed?.sheetNames.length ?? 0} sheet ditemukan
            </div>
          )}
        </div>
      )}

      {step === 2 && parsed && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <StatChip label="Baris Mentah" value={parsed.rawRowCount} color={C.slate} />
            <StatChip label="Peserta Valid" value={parsed.validRowCount} color={C.green} />
            <StatChip label="Duplikat" value={parsed.duplicateRowCount} color={C.amber} />
          </div>
          <IssueList issues={parsed.issues} />
          {errorCount > 0 && (
            <p className="text-[12.5px] font-semibold" style={{ color: C.red }}>
              Upload tidak dapat dilanjutkan sebelum error di atas diperbaiki pada file sumber.
            </p>
          )}
          {errorCount === 0 && warningCount > 0 && (
            <label className="flex items-center gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
              <input type="checkbox" checked={acknowledgedWarnings} onChange={(e) => setAcknowledgedWarnings(e.target.checked)} />
              Saya memahami warning di atas dan tetap ingin melanjutkan.
            </label>
          )}
        </div>
      )}

      {step === 3 && previewWebinar && previewMetrics && (
        <div className="space-y-3">
          <Card className="p-4">
            <p className="text-[13px] font-bold" style={{ color: C.ink }}>{previewWebinar.metadata.title}</p>
            <p className="text-[12px]" style={{ color: C.slate }}>{previewWebinar.metadata.date} · {previewWebinar.metadata.sourceName}</p>
          </Card>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatChip label="Peserta" value={previewMetrics.attendance.databaseParticipantCount} color={C.slate} />
            <StatChip label="Hadir Valid" value={previewMetrics.attendance.zoomValidAttendeeCount} color={C.blue} />
            <StatChip label="Rata-rata Pre" value={previewMetrics.learning.preAverage ?? "-"} color={C.violet} />
            <StatChip label="Rata-rata Post" value={previewMetrics.learning.postAverage ?? "-"} color={C.green} />
          </div>
          <Card className="p-4">
            <p className="mb-2 text-[12.5px] font-semibold" style={{ color: C.ink }}>Distribusi Unit (Top 5)</p>
            <ul className="space-y-1 text-[12px]" style={{ color: C.inkSoft }}>
              {previewMetrics.units.slice(0, 5).map((u) => <li key={u.unit}>{u.unit} — {num(u.count)}</li>)}
            </ul>
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-[12.5px] font-semibold" style={{ color: C.ink }}>Contoh Peserta (email/NIP/HP disamarkan)</p>
            <div className="max-h-56 overflow-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                    <th className="px-2 py-1 text-left">Nama</th>
                    <th className="px-2 py-1 text-left">Unit</th>
                    <th className="px-2 py-1 text-left">Email</th>
                    <th className="px-2 py-1 text-left">NIP</th>
                    <th className="px-2 py-1 text-left">HP</th>
                  </tr>
                </thead>
                <tbody>
                  {previewWebinar.participants.slice(0, 8).map((p) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.page}` }}>
                      <td className="px-2 py-1">{p.name}</td>
                      <td className="px-2 py-1">{p.unitFinal}</td>
                      <td className="px-2 py-1">{maskEmail(p.email)}</td>
                      <td className="px-2 py-1">{maskNip(p.nip)}</td>
                      <td className="px-2 py-1">{maskPhone(p.phone)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {step === 4 && previewWebinar && (
        <div className="space-y-3">
          {existingMatch ? (
            <Card className="p-4" style={{ borderColor: C.amber }}>
              <p className="text-[13px] font-bold" style={{ color: C.amber }}>ID webinar "{form.id}" sudah ada</p>
              <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
                Menyimpan akan MENGGANTI data webinar yang sudah ada. Ringkasan perubahan:
              </p>
              {replaceDiff && (
                <ul className="mt-2 space-y-1 text-[12.5px]" style={{ color: C.inkSoft }}>
                  <li>Peserta: {num(replaceDiff.oldParticipantCount)} → {num(replaceDiff.newParticipantCount)}</li>
                  <li>Rata-rata Pre: {replaceDiff.oldPreAverage ?? "-"} → {replaceDiff.newPreAverage ?? "-"}</li>
                  <li>Rata-rata Post: {replaceDiff.oldPostAverage ?? "-"} → {replaceDiff.newPostAverage ?? "-"}</li>
                  <li>Feedback: {num(replaceDiff.oldFeedbackCount)} → {num(replaceDiff.newFeedbackCount)}</li>
                </ul>
              )}
            </Card>
          ) : (
            <Card className="p-4" style={{ borderColor: C.green }}>
              <p className="text-[13px] font-bold" style={{ color: C.green }}>Webinar baru akan ditambahkan</p>
              <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
                Tab "Webinar #{form.number}" akan otomatis dibuat, dan seluruh ringkasan lintas webinar akan diperbarui.
              </p>
            </Card>
          )}
          <p className="text-[11.5px]" style={{ color: C.slateSoft }}>
            Data ini tersimpan lokal di browser/perangkat ini (IndexedDB) — belum ada backend server pada versi ini.
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: C.line }}>
        <SecondaryButton icon={ChevronLeft} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Kembali
        </SecondaryButton>
        {step < 4 ? (
          <PrimaryButton
            icon={ChevronRight}
            disabled={
              (step === 0 && metadataIssues.length > 0) ||
              (step === 1 && !parsed) ||
              (step === 2 && !canProceedFromValidation)
            }
            onClick={() => setStep((s) => Math.min(4, s + 1))}
          >
            Lanjut
          </PrimaryButton>
        ) : (
          <PrimaryButton icon={Check} onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan…" : "Tambahkan ke Dashboard"}
          </PrimaryButton>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-semibold" style={{ color: C.slate }}>{label}</span>
      {children}
    </label>
  );
}
