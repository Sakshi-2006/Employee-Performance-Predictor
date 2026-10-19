import type { PerfBand } from "@/lib/types";

export const BAND_COLORS: Record<PerfBand, string> = {
  High: "#10b981",
  Medium: "#f59e0b",
  Low: "#ef4444",
};

export const BAND_BG: Record<PerfBand, string> = {
  High: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-rose-100 text-rose-700",
};

export function prettify(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fmtPct(n: number, d = 1): string {
  return `${(n * 100).toFixed(d)}%`;
}
