import { useMemo } from "react";
import type { Employee, ModelFeature, PerfBand } from "@/lib/types";
import { BAND_BG, BAND_COLORS, prettify } from "./ui";
import { HistogramChart } from "./HistogramChart";
import { DonutChart } from "./DonutChart";
import { BarChart } from "./BarChart";
import { histogram, classDistribution, featureStats } from "@/lib/stats";
import type { TrainedModel } from "@/lib/model";
import { Users, TrendingUp, Target, Award } from "lucide-react";

interface Props {
  employees: Employee[];
  model: TrainedModel;
}

export function DashboardView({ employees, model }: Props) {
  const dist = useMemo(() => classDistribution(employees), [employees]);
  const stats = useMemo(() => featureStats(employees), [employees]);
  const topCorr = useMemo(
    () => [...stats].sort((a, b) => Math.abs(b.corrWithTarget) - Math.abs(a.corrWithTarget)).slice(0, 10),
    [stats]
  );

  const highPct = dist.find((d) => d.band === "High")?.pct ?? 0;
  const lowPct = dist.find((d) => d.band === "Low")?.pct ?? 0;

  const histFeature: ModelFeature = "on_time_delivery_rate";
  const hist = useMemo(() => histogram(employees.map((e) => Number(e[histFeature])), 14), [employees]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users className="w-5 h-5" />} label="Employees" value={employees.length.toString()} accent="slate" />
        <KpiCard icon={<Target className="w-5 h-5" />} label="Model Accuracy" value={`${(model.metrics.accuracy * 100).toFixed(1)}%`} accent="emerald" />
        <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Macro F1" value={model.metrics.macroF1.toFixed(3)} accent="amber" />
        <KpiCard icon={<Award className="w-5 h-5" />} label="High Performers" value={`${(highPct * 100).toFixed(1)}%`} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-1">Performance Band Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Target variable across the synthetic workforce</p>
          <div className="flex items-center gap-6 flex-wrap">
            <DonutChart
              segments={dist.map((d) => ({ label: d.band, value: d.count, color: BAND_COLORS[d.band] }))}
              centerLabel={employees.length.toString()}
              centerSub="employees"
            />
            <div className="space-y-2">
              {dist.map((d) => (
                <div key={d.band} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BAND_COLORS[d.band] }} />
                  <span className="text-slate-700 w-16">{d.band}</span>
                  <span className="font-medium tabular-nums">{d.count}</span>
                  <span className="text-slate-400 text-xs">({(d.pct * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-1">Top Drivers of Performance</h3>
          <p className="text-xs text-slate-500 mb-4">Pearson correlation of each feature with the performance band</p>
          <BarChart
            bars={topCorr.map((s) => ({
              label: prettify(s.feature),
              value: s.corrWithTarget,
              color: s.corrWithTarget >= 0 ? "#0d9488" : "#dc2626",
            }))}
            format={(v) => v.toFixed(2)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-1">On-Time Delivery Rate</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution across the workforce</p>
          <HistogramChart bins={hist} color="#0d9488" height={180} />
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-1">Model Performance</h3>
          <p className="text-xs text-slate-500 mb-4">Hold-out test set ({model.metrics.testSize} employees)</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(["High", "Medium", "Low"] as PerfBand[]).map((b) => (
              <div key={b} className="rounded-lg border border-slate-200 p-3">
                <span className={`chip ${BAND_BG[b]} mb-2`}>{b}</span>
                <div className="text-xl font-bold tabular-nums">{(model.metrics.perClassF1[b] * 100).toFixed(1)}%</div>
                <div className="text-[11px] text-slate-500">F1 score</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            The model correctly identifies {(model.metrics.accuracy * 100).toFixed(1)}% of employees on the held-out test
            set. Macro-F1 of {model.metrics.macroF1.toFixed(3)} balances performance across all three bands, important
            when class distribution is skewed ({(lowPct * 100).toFixed(0)}% Low, {(highPct * 100).toFixed(0)}% High).
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "slate" | "emerald" | "amber";
}) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[accent]}`}>{icon}</div>
      <div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        <div className="stat-num text-slate-900">{value}</div>
      </div>
    </div>
  );
}
