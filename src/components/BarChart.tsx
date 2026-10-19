import type { PerfBand } from "@/lib/types";
import { BAND_COLORS } from "./ui";

interface Bar {
  label: string;
  value: number;
  band?: PerfBand;
  color?: string;
}

interface Props {
  bars: Bar[];
  format?: (v: number) => string;
  height?: number;
}

export function BarChart({ bars, format = (v) => v.toFixed(2), height = 200 }: Props) {
  const max = Math.max(...bars.map((b) => Math.abs(b.value)), 0.0001);
  return (
    <div className="space-y-2" style={{ minHeight: height }}>
      {bars.map((b, i) => {
        const color = b.color ?? (b.band ? BAND_COLORS[b.band] : "#0f172a");
        const pct = (Math.abs(b.value) / max) * 100;
        return (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className="w-36 shrink-0 truncate text-right text-slate-600 text-xs">{b.label}</div>
            <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden relative">
              <div
                className="h-full rounded-md transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: color, animationDelay: `${i * 40}ms` }}
              />
            </div>
            <div className="w-16 shrink-0 text-xs font-medium text-slate-700 tabular-nums">{format(b.value)}</div>
          </div>
        );
      })}
    </div>
  );
}
