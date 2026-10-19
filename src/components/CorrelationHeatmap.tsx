import type { ModelFeature } from "@/lib/types";

interface Props {
  features: ModelFeature[];
  matrix: number[][];
}

export function CorrelationHeatmap({ features, matrix }: Props) {
  const short = (f: string) =>
    f
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w[0]?.toUpperCase())
      .join("");

  function color(v: number): string {
    const t = Math.abs(v);
    if (v >= 0) return `rgba(15, 118, 110, ${t})`; // teal
    return `rgba(220, 38, 38, ${t})`; // red
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-[10px]">
        <thead>
          <tr>
            <th className="p-1"></th>
            {features.map((f) => (
              <th key={f} className="p-1 text-slate-500 font-medium" title={f}>
                {short(f)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="p-1 text-right text-slate-500 font-medium pr-2" title={features[i]}>
                {short(features[i])}
              </td>
              {row.map((v, j) => (
                <td
                  key={j}
                  className="p-0.5 text-center tabular-nums"
                  style={{ backgroundColor: color(v), color: Math.abs(v) > 0.5 ? "#fff" : "#334155" }}
                  title={`${features[i]} ↔ ${features[j]}: ${v.toFixed(2)}`}
                >
                  {v.toFixed(1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
