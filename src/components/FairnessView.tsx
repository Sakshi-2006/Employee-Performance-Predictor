import { useMemo, useState } from "react";
import type { Employee } from "@/lib/types";
import { fairnessByGroup, type GroupFairness } from "@/lib/stats";
import { BarChart } from "./BarChart";
import { fmtPct } from "./ui";
import { Scale, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  employees: Employee[];
}

type GroupKey = "department" | "gender" | "education";

export function FairnessView({ employees }: Props) {
  const [group, setGroup] = useState<GroupKey>("department");
  const groups = useMemo(() => fairnessByGroup(employees, group), [employees, group]);

  const highRates = groups.map((g) => g.highRate);
  const maxHigh = Math.max(...highRates);
  const minHigh = Math.min(...highRates);
  const disparity = maxHigh - minHigh;
  const threshold = 0.1;
  const isFair = disparity < threshold;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-600" />
              <h2 className="font-semibold text-slate-800">Fairness & Bias Audit</h2>
            </div>
            <p className="text-xs text-slate-500">Selection rate for "High" band across demographic groups</p>
          </div>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as GroupKey)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="department">Department</option>
            <option value="gender">Gender</option>
            <option value="education">Education</option>
          </select>
        </div>

        <div className={`rounded-xl p-4 mb-5 flex items-center gap-3 ${isFair ? "bg-emerald-50" : "bg-amber-50"}`}>
          {isFair ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          )}
          <div className="text-sm">
            <div className={`font-semibold ${isFair ? "text-emerald-800" : "text-amber-800"}`}>
              {isFair ? "Within fairness threshold" : "Disparity detected"}
            </div>
            <div className={isFair ? "text-emerald-700" : "text-amber-700"}>
              Max–min High-band selection rate gap: <span className="font-medium tabular-nums">{fmtPct(disparity)}</span>{" "}
              (threshold {fmtPct(threshold)}).
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">High-band selection rate</h3>
            <BarChart
              bars={groups.map((g) => ({
                label: g.group,
                value: g.highRate,
                color: "#0d9488",
              }))}
              format={(v) => fmtPct(v)}
              height={240}
            />
          </div>
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Low-band rate</h3>
            <BarChart
              bars={groups.map((g) => ({
                label: g.group,
                value: g.lowRate,
                color: "#dc2626",
              }))}
              format={(v) => fmtPct(v)}
              height={240}
            />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Group Detail</h3>
        <p className="text-xs text-slate-500 mb-4">Average band score (0=Low, 1=Medium, 2=High) and headcount</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4 font-medium">Group</th>
                <th className="py-2 pr-4 font-medium text-right">Headcount</th>
                <th className="py-2 pr-4 font-medium text-right">High rate</th>
                <th className="py-2 pr-4 font-medium text-right">Low rate</th>
                <th className="py-2 pr-4 font-medium text-right">Avg score</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.group} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{g.group}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{g.count}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-emerald-700">{fmtPct(g.highRate)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-rose-700">{fmtPct(g.lowRate)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{g.avgScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-2">Mitigation Playbook</h3>
        <ol className="space-y-2.5 text-sm text-slate-600 list-decimal list-inside">
          <li><span className="font-medium text-slate-800">Exclude sensitive features</span> from training inputs if they drive disparate impact (gender is retained here only for auditing, not as a model feature).</li>
          <li><span className="font-medium text-slate-800">Group-aware thresholds</span> — calibrate the decision boundary per group so selection rates approximate parity.</li>
          <li><span className="font-medium text-slate-800">Reweighting</span> — up-weight underrepresented groups during training to balance influence.</li>
          <li><span className="font-medium text-slate-800">Human-in-the-loop</span> — model outputs augment, never replace, manager judgement. Disputes route to HR review.</li>
          <li><span className="font-medium text-slate-800">Re-audit each cycle</span> — fairness is monitored continuously, not checked once.</li>
        </ol>
      </div>
    </div>
  );
}
