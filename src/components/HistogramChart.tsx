import type { HistogramBin } from "@/lib/stats";

interface Props {
  bins: HistogramBin[];
  color?: string;
  height?: number;
}

export function HistogramChart({ bins, color = "#0f172a", height = 160 }: Props) {
  const max = Math.max(...bins.map((b) => b.count), 1);
  const width = 100 / bins.length;
  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-full">
        {bins.map((b, i) => {
          const h = (b.count / max) * (height - 24);
          return (
            <g key={i}>
              <rect
                x={i * width + 0.5}
                y={height - 20 - h}
                width={width - 1}
                height={h}
                fill={color}
                opacity={0.85}
                className="animate-bar"
                style={{ animationDelay: `${i * 30}ms` }}
              />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{bins[0]?.lo.toFixed(1)}</span>
        <span>{bins[bins.length - 1]?.hi.toFixed(1)}</span>
      </div>
    </div>
  );
}
