"use client";

import React from "react";
import { C, num, tnum } from "@/lib/theme";

export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl bg-white ${className}`}
      style={{ border: `1px solid ${C.line}`, boxShadow: "0 1px 2px rgba(16,26,43,.04)", ...style }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  icon: Icon,
  children,
  hint,
  action,
}: {
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  children: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={17} style={{ color: C.blue }} />}
        <h3 className="text-[15px] font-semibold" style={{ color: C.ink }}>{children}</h3>
        {hint && <span className="text-xs" style={{ color: C.slateSoft }}>· {hint}</span>}
      </div>
      {action}
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  accent = C.blue,
  overridden,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
  overridden?: boolean;
}) {
  return (
    <Card className="px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide" style={{ color: C.slate }}>
        {label}
        {overridden && <Badge tone="amber">Manual</Badge>}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[26px] font-bold leading-none" style={{ color: accent, ...tnum }}>
          {typeof value === "number" ? num(value) : value}
        </span>
      </div>
      {sub && <div className="mt-1 text-[11px]" style={{ color: C.slateSoft }}>{sub}</div>}
    </Card>
  );
}

export function StatChip({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon?: React.ComponentType<{ size?: number }>;
  label: string;
  value: number | string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl p-3" style={{ background: color + "0E", border: `1px solid ${color}33` }}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color }}>
        {Icon && <Icon size={13} />}
        {label}
      </div>
      <div className="mt-0.5">
        <span className="text-xl font-bold" style={{ color, ...tnum }}>{typeof value === "number" ? num(value) : value}</span>
      </div>
      {sub && <div className="text-[10.5px]" style={{ color: C.slate }}>{sub}</div>}
    </div>
  );
}

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" }) {
  const toneColor = { slate: C.slate, green: C.green, amber: C.amber, red: C.red, blue: C.blue }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: toneColor, background: toneColor + "15" }}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-10 text-center" style={{ background: C.page }}>
      <div className="text-sm font-semibold" style={{ color: C.slate }}>{title}</div>
      {hint && <div className="text-xs" style={{ color: C.slateSoft }}>{hint}</div>}
    </div>
  );
}

export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl px-4 py-10 text-sm" style={{ color: C.slate, background: C.page }}>
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  icon: Icon,
  type = "button",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ComponentType<{ size?: number }>;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition disabled:opacity-50 ${className}`}
      style={{ background: C.blue }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  icon: Icon,
  tone = "slate",
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ComponentType<{ size?: number }>;
  tone?: "slate" | "red";
  className?: string;
  disabled?: boolean;
}) {
  const color = tone === "red" ? C.red : C.inkSoft;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${className}`}
      style={{ color, borderColor: tone === "red" ? C.red + "55" : C.line, background: "white" }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

export function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold"
      style={{ background: checked ? C.blue + "18" : "white", border: `1px solid ${checked ? C.blue : C.line}`, color: checked ? C.blue : C.inkSoft }}
    >
      <span
        className="relative h-4 w-7 rounded-full transition"
        style={{ background: checked ? C.blue : C.grey }}
      >
        <span
          className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all"
          style={{ left: checked ? 14 : 2 }}
        />
      </span>
      {label}
    </button>
  );
}

export function IssueList({ issues }: { issues: { level: "error" | "warning" | "info"; message: string; count?: number }[] }) {
  if (issues.length === 0) return <EmptyState title="Tidak ada catatan validasi." />;
  const order = { error: 0, warning: 1, info: 2 };
  const sorted = [...issues].sort((a, b) => order[a.level] - order[b.level]);
  return (
    <ul className="space-y-1.5">
      {sorted.map((issue, i) => {
        const tone = issue.level === "error" ? C.red : issue.level === "warning" ? C.amber : C.slate;
        const label = issue.level === "error" ? "ERROR" : issue.level === "warning" ? "WARNING" : "INFO";
        return (
          <li key={i} className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px]" style={{ background: tone + "0D" }}>
            <span className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: tone }}>{label}</span>
            <span style={{ color: C.inkSoft }}>{issue.message}</span>
          </li>
        );
      })}
    </ul>
  );
}
