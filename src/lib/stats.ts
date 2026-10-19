import type { Employee, PerfBand, ModelFeature } from "./types";
import { NUMERIC_FEATURES } from "./types";

export interface FeatureStats {
  feature: ModelFeature;
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  // correlation with "High" probability proxy (band numeric)
  corrWithTarget: number;
}

export interface ClassDist {
  band: PerfBand;
  count: number;
  pct: number;
}

export interface HistogramBin {
  lo: number;
  hi: number;
  count: number;
}

export interface GroupFairness {
  group: string;
  highRate: number;
  lowRate: number;
  count: number;
  avgScore: number;
}

const BANDS: PerfBand[] = ["Low", "Medium", "High"];

function bandNum(b: PerfBand): number {
  return b === "Low" ? 0 : b === "Medium" ? 1 : 2;
}

export function pearson(a: number[], b: number[]): number {
  const n = a.length;
  if (n === 0) return 0;
  const ma = a.reduce((x, y) => x + y, 0) / n;
  const mb = b.reduce((x, y) => x + y, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

export function featureStats(employees: Employee[]): FeatureStats[] {
  const target = employees.map((e) => bandNum(e.perf_band_next));
  return NUMERIC_FEATURES.map((f) => {
    const vals = employees.map((e) => Number(e[f]));
    const sorted = [...vals].sort((a, b) => a - b);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    return {
      feature: f,
      mean,
      std: Math.sqrt(variance),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      corrWithTarget: pearson(vals, target),
    };
  });
}

export function classDistribution(employees: Employee[]): ClassDist[] {
  const counts: Record<PerfBand, number> = { Low: 0, Medium: 0, High: 0 };
  for (const e of employees) counts[e.perf_band_next]++;
  const n = employees.length || 1;
  return BANDS.map((b) => ({ band: b, count: counts[b], pct: counts[b] / n }));
}

export function histogram(values: number[], bins = 12): HistogramBin[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / bins || 1;
  const out: HistogramBin[] = [];
  for (let i = 0; i < bins; i++) {
    out.push({ lo: min + i * width, hi: min + (i + 1) * width, count: 0 });
  }
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    out[idx].count++;
  }
  return out;
}

export function correlationMatrix(employees: Employee[], features: ModelFeature[]): number[][] {
  const cols = features.map((f) => employees.map((e) => Number(e[f])));
  const m: number[][] = [];
  for (let i = 0; i < features.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < features.length; j++) {
      row.push(pearson(cols[i], cols[j]));
    }
    m.push(row);
  }
  return m;
}

export function fairnessByGroup(employees: Employee[], groupCol: "department" | "gender" | "education"): GroupFairness[] {
  const groups = Array.from(new Set(employees.map((e) => String(e[groupCol]))));
  return groups.map((g) => {
    const subset = employees.filter((e) => String(e[groupCol]) === g);
    const high = subset.filter((e) => e.perf_band_next === "High").length;
    const low = subset.filter((e) => e.perf_band_next === "Low").length;
    const avgScore = subset.reduce((a, e) => a + bandNum(e.perf_band_next), 0) / subset.length;
    return {
      group: g,
      highRate: high / subset.length,
      lowRate: low / subset.length,
      count: subset.length,
      avgScore,
    };
  });
}

export function bandAverage(employees: Employee[], feature: ModelFeature): Record<PerfBand, number> {
  const out = { Low: 0, Medium: 0, High: 0 } as Record<PerfBand, number>;
  const counts = { Low: 0, Medium: 0, High: 0 };
  for (const e of employees) {
    out[e.perf_band_next] += Number(e[feature]);
    counts[e.perf_band_next]++;
  }
  for (const b of BANDS) out[b] = counts[b] ? out[b] / counts[b] : 0;
  return out;
}
