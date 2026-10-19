import { useMemo, useState } from "react";
import type { Employee, ModelFeature } from "@/lib/types";
import { NUMERIC_FEATURES } from "@/lib/types";
import { featureStats, histogram, bandAverage, correlationMatrix } from "@/lib/stats";
import { HistogramChart } from "./HistogramChart";
import { BarChart } from "./BarChart";
import { CorrelationHeatmap } from "./CorrelationHeatmap";
import { BAND_COLORS, prettify } from "./ui";
import type { PerfBand } from "@/lib/types";

const BANDS: PerfBand[] = ["Low", "Medium", "High"];

interface Props {
  employees: Employee[];
}

export function EDAView({ employees }: Props) {
  const stats = useMemo(() => featureStats(employees), [employees]);
  const [selected, setSelected] = useState<ModelFeature>("on_time_delivery_rate");
  const [edaTab, setEdaTab] = useState<"distributions" | "correlation" | "byBand">("distributions");

  const hist = useMemo(() => histogram(employees.map((e) => Number(e[selected])), 14), [employees, selected]);
  const byBand = useMemo(() => bandAverage(employees, selected), [employees, selected]);

  const corrFeatures: ModelFeature[] = useMemo(
    () =>
      [...stats]
        .sort((a, b) => Math.abs(b.corrWithTarget) - Math.abs(a.corrWithTarget))
        .slice(0, 10)
        .map((s) => s.feature),
    [stats]
  );
  const corr = useMemo(() => correlationMatrix(employees, corrFeatures), [employees, corrFeatures]);

  const cur = stats.find((s) => s.feature === selected)!;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-slate-800">Exploratory Data Analysis</h2>
            <p className="text-xs text-slate-500">Inspect distributions, correlations, and band-wise patterns</p>
          </div>
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {(["distributions", "correlation", "byBand"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setEdaTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  edaTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "byBand" ? "By Band" : t === "distributions" ? "Distributions" : "Correlation"}
              </button>
            ))}
          </div>
        </div>

        {edaTab === "distributions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-700 text-sm">{prettify(selected)} — distribution</h3>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value as ModelFeature)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                >
                  {NUMERIC_FEATURES.map((f) => (
                    <option key={f} value={f}>
                      {prettify(f)}
                    </option>
                  ))}
                </select>
              </div>
              <HistogramChart bins={hist} color="#0d9488" height={220} />
              <div className="grid grid-cols-4 gap-3 mt-4 text-center">
                <Stat label="Mean" value={cur.mean.toFixed(2)} />
                <Stat label="Median" value={cur.median.toFixed(2)} />
                <Stat label="Std" value={cur.std.toFixed(2)} />
                <Stat label="Range" value={`${cur.min.toFixed(1)}–${cur.max.toFixed(1)}`} />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-slate-700 text-sm mb-3">Correlation with target</h3>
              <BarChart
                bars={stats
                  .sort((a, b) => Math.abs(b.corrWithTarget) - Math.abs(a.corrWithTarget))
                  .slice(0, 12)
                  .map((s) => ({
                    label: prettify(s.feature),
                    value: s.corrWithTarget,
                    color: s.corrWithTarget >= 0 ? "#0d9488" : "#dc2626",
                  }))}
                format={(v) => v.toFixed(2)}
                height={260}
              />
            </div>
          </div>
        )}

        {edaTab === "correlation" && (
          <div>
            <h3 className="font-medium text-slate-700 text-sm mb-3">
              Correlation matrix — top {corrFeatures.length} features
            </h3>
            <CorrelationHeatmap features={corrFeatures} matrix={corr} />
            <p className="text-xs text-slate-500 mt-4 max-w-2xl leading-relaxed">
              Teal cells indicate positive correlation, red cells negative. Strong inter-feature correlation
              (e.g. on-time delivery vs. task delay) signals redundancy that the random forest handles through
              feature subsampling at each split.
            </p>
          </div>
        )}

        {edaTab === "byBand" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-700 text-sm">Average {prettify(selected)} by performance band</h3>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value as ModelFeature)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
              >
                {NUMERIC_FEATURES.map((f) => (
                  <option key={f} value={f}>
                    {prettify(f)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {BANDS.map((b) => (
                <div key={b} className="rounded-xl border border-slate-200 p-5">
                  <span
                    className="chip text-white"
                    style={{ backgroundColor: BAND_COLORS[b] }}
                  >
                    {b}
                  </span>
                  <div className="text-3xl font-bold mt-3 tabular-nums">{byBand[b].toFixed(2)}</div>
                  <div className="text-xs text-slate-500 mt-1">avg {prettify(selected)}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 max-w-2xl leading-relaxed">
              Comparing the average feature value across bands reveals directional signal. For on-time delivery,
              High performers average noticeably higher than Low — a pattern the model exploits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-semibold text-slate-800 text-sm mt-0.5">{value}</div>
    </div>
  );
}
