export const C = {
  ink: "#0E1A2B", inkSoft: "#1E2D44", line: "#E4E9F2", page: "#F5F7FB",
  blue: "#2563EB", blueSoft: "#7CA8F7", cyan: "#0EA5E9",
  amber: "#D97706", amberSoft: "#F59E0B", green: "#0E9F6E", red: "#DC2626", violet: "#7C3AED",
  slate: "#64748B", slateSoft: "#94A3B8", grey: "#CBD5E1",
} as const;

export const SERIES_COLORS = [C.blue, C.amber, C.green, C.violet, C.cyan, C.red, C.slate, C.amberSoft];

export function colorForIndex(i: number): string {
  return SERIES_COLORS[i % SERIES_COLORS.length];
}

export function num(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "0";
  return Number(n).toLocaleString("id-ID");
}

export function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "-";
  return `${Number(n).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}

export const tnum = { fontVariantNumeric: "tabular-nums" } as const;

/** Formats an ISO timestamp as WIB (Asia/Jakarta) regardless of the server's or viewer's own timezone. */
export function formatWib(iso: string): string {
  return `${new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`;
}
