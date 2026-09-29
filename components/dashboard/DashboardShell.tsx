"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Zap, Plus, PencilLine, Download, Upload, FileSpreadsheet, RotateCcw, Printer, ShieldCheck,
  Cloud, CloudOff, KeyRound,
} from "lucide-react";
import { ToastProvider, useToast } from "./ui/Toast";
import { ConfirmModal, Modal } from "./ui/Modal";
import { SecondaryButton, PrimaryButton, LoadingState, Badge } from "./ui/primitives";
import { WebinarUploadWizard } from "./WebinarUploadWizard";
import { OverviewDashboard } from "./OverviewDashboard";
import { WebinarDashboard } from "./WebinarDashboard";
import { webinarRepository } from "@/lib/storage/indexeddb-repository";
import { loadSettings, saveSettings } from "@/lib/storage/settings";
import { getSeenSeedIds, markSeedIdsSeen } from "@/lib/storage/seen-seeds";
import { exportAggregateCsv, exportDashboardJson, importDashboardJson } from "@/lib/storage/export-import";
import { downloadTemplateWorkbook } from "@/lib/excel/template-generator";
import { getSeedWebinars } from "@/lib/migration";
import { calculateWebinarMetrics } from "@/lib/analytics/webinar-metrics";
import { applyKpiOverrides } from "@/lib/analytics/kpi-overrides";
import type { WebinarWithMetrics } from "@/lib/analytics/cross-webinar";
import { buildPublishedSnapshot, buildShellWebinar } from "@/lib/publish/build-snapshot";
import { fetchPublishedWebinars, publishWebinarSnapshot, unpublishWebinar, type PublishResult } from "@/lib/publish/client";
import type { PublishedWebinarSnapshot } from "@/types/published";
import { C } from "@/lib/theme";
import type { Participant, Webinar, WebinarMetadata, WebinarNarratives } from "@/types/webinar";
import type { WebinarMetrics } from "@/types/analytics";

const PUBLISH_SECRET_STORAGE_KEY = "webinar-dashboard-publish-secret";

type PendingAction = { type: "publish"; snapshot: PublishedWebinarSnapshot } | { type: "unpublish"; id: string; number: number };

interface DisplayEntry {
  webinar: Webinar;
  metrics: WebinarMetrics;
  rawMetrics: WebinarMetrics;
  overriddenKeys: Set<string>;
  readOnly: boolean;
}

function resolveLocalEntry(webinar: Webinar): DisplayEntry {
  const rawMetrics = calculateWebinarMetrics(webinar);
  const { metrics, overriddenKeys } = applyKpiOverrides(rawMetrics, webinar.kpiOverrides);
  return { webinar, metrics, rawMetrics, overriddenKeys, readOnly: false };
}

function resolveRemoteEntry(snapshot: PublishedWebinarSnapshot): DisplayEntry {
  const webinar = buildShellWebinar(snapshot);
  const overriddenKeys = new Set(snapshot.overriddenKeys);
  return { webinar, metrics: snapshot.metrics, rawMetrics: snapshot.metrics, overriddenKeys, readOnly: true };
}

function DashboardShellInner() {
  const toast = useToast();
  const [webinars, setWebinars] = useState<Webinar[] | null>(null);
  const [remoteSnapshots, setRemoteSnapshots] = useState<PublishedWebinarSnapshot[]>([]);
  const [sharedConfigured, setSharedConfigured] = useState(true);
  const [tab, setTab] = useState<string>("overview");
  const [editMode, setEditMode] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<Webinar | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [publishSecret, setPublishSecretState] = useState<string | null>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const pendingActionsRef = useRef<PendingAction[]>([]);
  const warnedStorageRef = useRef(false);

  const refresh = useCallback(async () => {
    const list = await webinarRepository.list();
    setWebinars(list);
    return list;
  }, []);

  useEffect(() => {
    const settings = loadSettings();
    setTab(settings.selectedTab || "overview");
    setEditMode(settings.editMode);
    const storedSecret = typeof window !== "undefined" ? sessionStorage.getItem(PUBLISH_SECRET_STORAGE_KEY) : null;
    if (storedSecret) setPublishSecretState(storedSecret);

    (async () => {
      let list = await webinarRepository.list();
      // Merge in any seed webinar this browser has never seen before (e.g. a
      // newly-added Webinar 4 after a code update) without touching existing
      // local data — no "Reset ke Seed Data" required. A seed already marked
      // "seen" is never re-added even if it's currently absent, so a
      // deliberate deletion is respected and never silently undone.
      const seenIds = new Set(getSeenSeedIds());
      const seeds = getSeedWebinars();
      const newSeeds = seeds.filter((w) => !seenIds.has(w.id) && !list.some((existing) => existing.id === w.id));
      if (newSeeds.length > 0) {
        for (const w of newSeeds) await webinarRepository.save(w);
        list = await webinarRepository.list();
      }
      markSeedIdsSeen(seeds.map((w) => w.id));
      setWebinars(list);
      // Silently keep the shared store in sync too, but only if this browser
      // already has the publish secret cached — never pop the passcode modal
      // just from loading the page.
      if (newSeeds.length > 0 && storedSecret) {
        for (const w of newSeeds) {
          const { metrics, overriddenKeys } = resolveLocalEntry(w);
          void runAction({ type: "publish", snapshot: buildPublishedSnapshot(w, metrics, overriddenKeys) }, storedSecret);
        }
      }
    })();

    (async () => {
      const { webinars: snaps, configured } = await fetchPublishedWebinars();
      setRemoteSnapshots(snaps);
      setSharedConfigured(configured);
    })();
  }, []);

  useEffect(() => { saveSettings({ selectedTab: tab }); }, [tab]);
  useEffect(() => { saveSettings({ editMode }); }, [editMode]);

  function setPublishSecret(secret: string) {
    sessionStorage.setItem(PUBLISH_SECRET_STORAGE_KEY, secret);
    setPublishSecretState(secret);
  }

  function clearPublishSecret() {
    sessionStorage.removeItem(PUBLISH_SECRET_STORAGE_KEY);
    setPublishSecretState(null);
  }

  const handlePublishResult = useCallback((result: PublishResult, action: PendingAction) => {
    if (result.ok) {
      if (action.type === "publish") {
        const snapshot = action.snapshot;
        setRemoteSnapshots((prev) => [...prev.filter((s) => s.id !== snapshot.id), snapshot]);
        toast.show(`Angka Webinar #${snapshot.number} dibagikan ke semua pengunjung.`, "success");
      } else {
        setRemoteSnapshots((prev) => prev.filter((s) => s.id !== action.id));
        toast.show(`Webinar #${action.number} dihapus dari data yang dibagikan.`, "success");
      }
      return;
    }
    if (result.error === "STORAGE_NOT_CONFIGURED") {
      setSharedConfigured(false);
      if (!warnedStorageRef.current) {
        warnedStorageRef.current = true;
        toast.show(
          "Belum ada penyimpanan bersama yang diset di server ini — perubahan hanya tersimpan di browser Anda sendiri. Lihat README bagian \"Berbagi Angka ke Semua Pengunjung\".",
          "info",
        );
      }
      return;
    }
    if (result.error === "UNAUTHORIZED") {
      clearPublishSecret();
      pendingActionsRef.current.push(action);
      toast.show("Sandi publish salah. Masukkan sandi yang benar untuk membagikan perubahan ini.", "error");
      setSecretModalOpen(true);
      return;
    }
    toast.show("Gagal membagikan perubahan (masalah jaringan). Perubahan tetap tersimpan lokal, coba lagi nanti.", "error");
  }, [toast]);

  const runAction = useCallback(async (action: PendingAction, secret: string) => {
    const result = action.type === "publish"
      ? await publishWebinarSnapshot(action.snapshot, secret)
      : await unpublishWebinar(action.id, secret);
    handlePublishResult(result, action);
  }, [handlePublishResult]);

  const ensureAction = useCallback((action: PendingAction) => {
    if (!sharedConfigured) {
      // No shared storage set up on this deployment at all — asking for a
      // passcode would be pointless friction, so just note it once and stop.
      if (!warnedStorageRef.current) {
        warnedStorageRef.current = true;
        toast.show(
          "Belum ada penyimpanan bersama yang diset di server ini — perubahan hanya tersimpan di browser Anda sendiri. Lihat README bagian \"Berbagi Angka ke Semua Pengunjung\".",
          "info",
        );
      }
      return;
    }
    if (publishSecret) {
      void runAction(action, publishSecret);
      return;
    }
    pendingActionsRef.current.push(action);
    setSecretModalOpen(true);
  }, [publishSecret, runAction, sharedConfigured, toast]);

  function handleSecretSubmit(secret: string) {
    setPublishSecret(secret);
    setSecretModalOpen(false);
    const actions = pendingActionsRef.current;
    pendingActionsRef.current = [];
    for (const action of actions) void runAction(action, secret);
  }

  function publishAllLocal(list: Webinar[]) {
    for (const w of list) {
      const { metrics, overriddenKeys } = resolveLocalEntry(w);
      ensureAction({ type: "publish", snapshot: buildPublishedSnapshot(w, metrics, overriddenKeys) });
    }
  }

  async function handleWizardSaved(webinar: Webinar) {
    await webinarRepository.save(webinar);
    await refresh();
    setTab(webinar.id);
    toast.show(`Webinar #${webinar.number} berhasil disimpan.`, "success");
    const { metrics, overriddenKeys } = resolveLocalEntry(webinar);
    ensureAction({ type: "publish", snapshot: buildPublishedSnapshot(webinar, metrics, overriddenKeys) });
  }

  async function handleDeleteWebinar(id: string, number: number) {
    await webinarRepository.remove(id);
    await refresh();
    setTab("overview");
    toast.show("Webinar berhasil dihapus.", "success");
    ensureAction({ type: "unpublish", id, number });
  }

  async function handleUpdateWebinar(id: string, patch: Partial<Webinar>) {
    if (!webinars) return;
    const current = webinars.find((w) => w.id === id);
    if (!current) return;
    const updated = { ...current, ...patch };
    await webinarRepository.save(updated);
    setWebinars(webinars.map((w) => (w.id === id ? updated : w)));
    const { metrics, overriddenKeys } = resolveLocalEntry(updated);
    ensureAction({ type: "publish", snapshot: buildPublishedSnapshot(updated, metrics, overriddenKeys) });
  }

  async function handleImportJson(file: File) {
    try {
      const result = await importDashboardJson(file);
      for (const w of result.webinars) await webinarRepository.save(w);
      await refresh();
      toast.show(`${result.webinars.length} webinar berhasil diimpor.`, "success");
      publishAllLocal(result.webinars);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Gagal mengimpor file JSON.", "error");
    }
  }

  async function handleResetSeed() {
    await webinarRepository.clear();
    const seeds = getSeedWebinars();
    for (const w of seeds) await webinarRepository.save(w);
    markSeedIdsSeen(seeds.map((w) => w.id));
    await refresh();
    setTab("overview");
    toast.show("Data direset ke seed awal.", "success");
    publishAllLocal(seeds);
  }

  const displayEntries: DisplayEntry[] = useMemo(() => {
    if (!webinars) return [];
    const localIds = new Set(webinars.map((w) => w.id));
    const local = webinars.map(resolveLocalEntry);
    const remote = remoteSnapshots.filter((s) => !localIds.has(s.id)).map(resolveRemoteEntry);
    return [...local, ...remote].sort((a, b) => a.webinar.number - b.webinar.number);
  }, [webinars, remoteSnapshots]);

  if (!webinars) {
    return (
      <div style={{ background: C.page, minHeight: "100vh" }} className="flex items-center justify-center">
        <LoadingState label="Memuat dashboard…" />
      </div>
    );
  }

  const sortedWebinars = displayEntries.map((e) => e.webinar);
  const activeEntry = displayEntries.find((e) => e.webinar.id === tab) ?? null;
  const crossWebinarEntries: WebinarWithMetrics[] = displayEntries.map((e) => ({ webinar: e.webinar, metrics: e.metrics }));

  return (
    <div style={{ background: C.page, minHeight: "100vh", color: C.ink, fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <header className="no-print" style={{ background: `linear-gradient(110deg, ${C.ink} 0%, ${C.inkSoft} 70%, #20406e 100%)` }}>
        <div className="mx-auto max-w-[1280px] px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,.10)" }}>
                <Zap size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard Evaluasi Series Webinar Nuclear — PLN &amp; ECADIN</h1>
                <p className="flex flex-wrap items-center gap-1.5 text-[12px]" style={{ color: "#A9BBD6" }}>
                  {sortedWebinars.length} webinar
                  {sharedConfigured ? (
                    <span className="flex items-center gap-1"><Cloud size={12} />dibagikan ke semua pengunjung</span>
                  ) : (
                    <span className="flex items-center gap-1"><CloudOff size={12} />belum ada penyimpanan bersama di server ini</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setEditMode((e) => !e)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white"
                style={{ background: editMode ? C.blue : "rgba(255,255,255,.12)" }}
              >
                <PencilLine size={15} />{editMode ? "Mode Edit: Aktif" : "Mode Edit"}
              </button>
              <button
                onClick={() => { setReplaceTarget(null); setWizardOpen(true); }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white"
                style={{ background: C.blue }}
              >
                <Plus size={15} />Tambah Webinar
              </button>
            </div>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto pb-1">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>Overview</TabButton>
            {sortedWebinars.map((w) => (
              <TabButton key={w.id} active={tab === w.id} onClick={() => setTab(w.id)}>Webinar #{w.number}</TabButton>
            ))}
            <TabButton active={tab === "data"} onClick={() => setTab("data")}>Data / Admin</TabButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-6">
        {tab === "overview" && <OverviewDashboard entries={crossWebinarEntries} />}
        {activeEntry && (
          <WebinarDashboard
            key={activeEntry.webinar.id}
            webinar={activeEntry.webinar}
            metrics={activeEntry.metrics}
            rawMetrics={activeEntry.rawMetrics}
            overriddenKeys={activeEntry.overriddenKeys}
            editMode={editMode}
            readOnly={activeEntry.readOnly}
            onUpdateNarratives={(narratives: WebinarNarratives) => handleUpdateWebinar(activeEntry.webinar.id, { narratives })}
            onUpdateMetadata={(metadata: WebinarMetadata) => handleUpdateWebinar(activeEntry.webinar.id, { metadata, id: metadata.id, number: metadata.number })}
            onUpdateParticipants={(participants: Participant[]) => handleUpdateWebinar(activeEntry.webinar.id, { participants })}
            onUpdateKpiOverrides={(kpiOverrides: Record<string, number>) => handleUpdateWebinar(activeEntry.webinar.id, { kpiOverrides })}
            onDeleteWebinar={() => handleDeleteWebinar(activeEntry.webinar.id, activeEntry.webinar.number)}
            onReplaceWebinar={() => { setReplaceTarget(activeEntry.webinar); setWizardOpen(true); }}
          />
        )}
        {tab === "data" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${C.line}` }}>
              <h3 className="mb-1 flex items-center gap-2 text-[15px] font-semibold"><ShieldCheck size={17} style={{ color: C.blue }} />Penyimpanan &amp; Privasi</h3>
              <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
                Data peserta mentah (nama, email, NIP, HP) hanya tersimpan lokal di IndexedDB browser/perangkat yang
                mengunggah file Excel-nya — tidak pernah dikirim ke server manapun. Yang dibagikan ke pengunjung lain
                hanyalah angka hasil hitung (KPI, narasi, distribusi unit) lewat penyimpanan bersama di bawah ini.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${C.line}` }}>
              <h3 className="mb-1 flex items-center gap-2 text-[15px] font-semibold">
                {sharedConfigured ? <Cloud size={17} style={{ color: C.blue }} /> : <CloudOff size={17} style={{ color: C.amber }} />}
                Status Berbagi Angka ke Semua Pengunjung
                {sharedConfigured ? <Badge tone="green">Aktif</Badge> : <Badge tone="amber">Belum diset</Badge>}
              </h3>
              <p className="mb-3 text-[12.5px]" style={{ color: C.inkSoft }}>
                {sharedConfigured
                  ? "Setiap kali Anda mengunggah webinar baru atau mengedit angka/metadata/narasi di Mode Edit, angka itu otomatis dibagikan ke semua orang yang membuka link ini."
                  : "Server ini belum terhubung ke penyimpanan bersama, jadi perubahan Anda hanya tersimpan di browser sendiri. Lihat bagian \"Berbagi Angka ke Semua Pengunjung\" di README untuk cara mengaktifkannya di Vercel."}
              </p>
              <SecondaryButton icon={KeyRound} onClick={() => setSecretModalOpen(true)}>
                {publishSecret ? "Ganti Sandi Publish" : "Masukkan Sandi Publish"}
              </SecondaryButton>
            </div>

            <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${C.line}` }}>
              <h3 className="mb-3 text-[15px] font-semibold">Ekspor &amp; Impor</h3>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton icon={FileSpreadsheet} onClick={() => downloadTemplateWorkbook()}>Download Template Excel</SecondaryButton>
                <SecondaryButton icon={Download} onClick={() => { if (confirm("Export ini menyertakan data peserta (nama/email/NIP/HP). Lanjutkan?")) exportDashboardJson([...webinars].sort((a, b) => a.number - b.number)); }}>
                  Export Semua Data (JSON)
                </SecondaryButton>
                <SecondaryButton icon={Upload} onClick={() => importInputRef.current?.click()}>Import Data (JSON)</SecondaryButton>
                <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportJson(f); }} />
                <SecondaryButton icon={FileSpreadsheet} onClick={() => exportAggregateCsv(crossWebinarEntries)}>Export Agregat (CSV)</SecondaryButton>
                <SecondaryButton icon={Printer} onClick={() => window.print()}>Mode Print / PDF</SecondaryButton>
                <SecondaryButton icon={RotateCcw} tone="red" onClick={() => setConfirmReset(true)}>Reset ke Seed Data</SecondaryButton>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${C.line}` }}>
              <h3 className="mb-3 text-[15px] font-semibold">Semua Webinar</h3>
              <div className="space-y-2">
                {sortedWebinars.map((w) => {
                  const entry = displayEntries.find((e) => e.webinar.id === w.id);
                  return (
                    <div key={w.id} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: C.page }}>
                      <div>
                        <p className="flex items-center gap-2 text-[13px] font-semibold">
                          Webinar #{w.number} — {w.metadata.title}
                          {entry?.readOnly && <Badge tone="blue">Dari perangkat lain</Badge>}
                        </p>
                        <p className="text-[11.5px]" style={{ color: C.slateSoft }}>
                          {entry?.readOnly ? "Data lokal tidak ada di perangkat ini" : `${w.participants.length} peserta`} · {w.metadata.date}
                        </p>
                      </div>
                      <button onClick={() => setTab(w.id)} className="text-[12.5px] font-semibold" style={{ color: C.blue }}>Buka →</button>
                    </div>
                  );
                })}
                {sortedWebinars.length === 0 && <p className="text-[12.5px]" style={{ color: C.slateSoft }}>Belum ada webinar tersimpan.</p>}
              </div>
            </div>
          </div>
        )}
      </main>

      <WebinarUploadWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        existingWebinars={sortedWebinars}
        onSaved={handleWizardSaved}
        replaceTarget={replaceTarget}
      />

      <ConfirmModal
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset ke Seed Data?"
        description="Seluruh webinar yang tersimpan akan dihapus dan diganti dengan data seed awal (Webinar 1 & 2). Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Reset"
        danger
        onConfirm={handleResetSeed}
      />

      <PublishSecretModal
        open={secretModalOpen}
        onOpenChange={(open) => { setSecretModalOpen(open); if (!open) pendingActionsRef.current = []; }}
        onSubmit={handleSecretSubmit}
      />
    </div>
  );
}

function PublishSecretModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (secret: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Sandi Publish Data"
      description='Masukkan sandi publish (nilai env "PUBLISH_SECRET" yang Anda set di Vercel) supaya perubahan ini bisa dibagikan ke semua pengunjung.'
      widthClassName="max-w-sm"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          onSubmit(value.trim());
          setValue("");
        }}
      >
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Sandi publish…"
          className="input w-full"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border px-3 py-2 text-[13px] font-semibold"
            style={{ borderColor: C.line, color: C.inkSoft }}
          >
            Batal
          </button>
          <PrimaryButton type="submit">Simpan &amp; Bagikan</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold transition"
      style={{ background: active ? "white" : "transparent", color: active ? C.ink : "#A9BBD6" }}
    >
      {children}
    </button>
  );
}

export function DashboardShell() {
  return (
    <ToastProvider>
      <DashboardShellInner />
    </ToastProvider>
  );
}
