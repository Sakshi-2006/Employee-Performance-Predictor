import { useMemo, useState } from "react";
import type { Employee, ModelFeature, PerfBand } from "@/lib/types";
import { NUMERIC_FEATURES } from "@/lib/types";
import { generateEmployeeFromInput } from "@/lib/data";
import { explainPrediction, type TrainedModel } from "@/lib/model";
import { BAND_COLORS, BAND_BG, prettify, fmtPct } from "./ui";
import { BarChart } from "./BarChart";
import { DonutChart } from "./DonutChart";
import { Sparkles, RotateCcw, Lightbulb, ArrowRight } from "lucide-react";

interface Props {
  model: TrainedModel;
  employees: Employee[];
}

interface FieldDef {
  feature: ModelFeature | string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

const SLIDERS: FieldDef[] = [
  { feature: "experience_years", label: "Experience (years)", min: 0, max: 40, step: 1, default: 5 },
  { feature: "job_level", label: "Job Level (1–5)", min: 1, max: 5, step: 1, default: 2 },
  { feature: "manager_tenure_years", label: "Manager Tenure (years)", min: 0, max: 12, step: 0.5, default: 1.5 },
  { feature: "projects_count", label: "Projects (last cycle)", min: 0, max: 18, step: 1, default: 4 },
  { feature: "on_time_delivery_rate", label: "On-Time Delivery Rate", min: 0, max: 1, step: 0.01, default: 0.8 },
  { feature: "avg_task_delay_days", label: "Avg Task Delay (days)", min: -5, max: 45, step: 0.5, default: 3 },
  { feature: "bug_count", label: "Bug Count", min: 0, max: 40, step: 1, default: 4 },
  { feature: "code_review_score", label: "Code Review Score (1–5)", min: 1, max: 5, step: 0.1, default: 3.5 },
  { feature: "qa_defect_density", label: "QA Defect Density", min: 0, max: 12, step: 0.1, default: 1.5 },
  { feature: "story_points_completed", label: "Story Points Completed", min: 0, max: 120, step: 1, default: 35 },
  { feature: "billable_hours_ratio", label: "Billable Hours Ratio", min: 0, max: 1, step: 0.01, default: 0.72 },
  { feature: "training_hours", label: "Training Hours", min: 0, max: 120, step: 1, default: 28 },
  { feature: "certifications_count", label: "Certifications", min: 0, max: 8, step: 1, default: 1 },
  { feature: "internal_hackathons_participated", label: "Hackathons Participated", min: 0, max: 8, step: 1, default: 1 },
  { feature: "sick_days", label: "Sick Days", min: 0, max: 30, step: 1, default: 3 },
  { feature: "unplanned_absences", label: "Unplanned Absences", min: 0, max: 20, step: 1, default: 2 },
  { feature: "avg_login_hours", label: "Avg Login Hours", min: 4, max: 12, step: 0.1, default: 8 },
  { feature: "peer_feedback_score", label: "Peer Feedback (1–5)", min: 1, max: 5, step: 0.1, default: 3.5 },
  { feature: "manager_score", label: "Manager Score (1–5)", min: 1, max: 5, step: 0.1, default: 3.4 },
  { feature: "kudos_count", label: "Kudos Count", min: 0, max: 40, step: 1, default: 4 },
  { feature: "promotions_in_2y", label: "Promotions (2yr)", min: 0, max: 4, step: 1, default: 0 },
  { feature: "salary_percentile_band", label: "Salary Percentile (1–5)", min: 1, max: 5, step: 1, default: 2 },
];

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Operations", "Finance", "HR"] as const;
const EDUCATION = ["Bachelors", "Masters", "PhD", "Diploma"] as const;
const GENDERS = ["Male", "Female", "Non-binary"] as const;

export function PredictorView({ model, employees }: Props) {
  const defaults = useMemo(() => {
    const d: Record<string, number | string> = {};
    for (const s of SLIDERS) d[s.feature] = s.default;
    d.department = "Engineering";
    d.education = "Bachelors";
    d.gender = "Male";
    d.age = 30;
    return d;
  }, []);

  const [form, setForm] = useState<Record<string, number | string>>(defaults);
  const [result, setResult] = useState<ReturnType<typeof explainPrediction> | null>(null);

  function predict() {
    const emp = generateEmployeeFromInput(form);
    setResult(explainPrediction(model, emp));
  }

  function reset() {
    setForm(defaults);
    setResult(null);
  }

  function loadSample(band: PerfBand) {
    const samples = employees.filter((e) => e.perf_band_next === band);
    if (samples.length === 0) return;
    const e = samples[Math.floor(Math.random() * samples.length)];
    const f: Record<string, number | string> = {};
    for (const s of SLIDERS) f[s.feature] = Number(e[s.feature as ModelFeature]);
    f.department = e.department;
    f.education = e.education;
    f.gender = e.gender;
    f.age = e.age;
    setForm(f);
    setResult(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-semibold text-slate-800">Employee Profile</h2>
              <p className="text-xs text-slate-500">Adjust work signals to predict next-cycle performance</p>
            </div>
            <div className="flex gap-2">
              {(["High", "Medium", "Low"] as PerfBand[]).map((b) => (
                <button
                  key={b}
                  onClick={() => loadSample(b)}
                  className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                  Sample {b}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <SelectField label="Department" value={String(form.department)} options={[...DEPARTMENTS]} onChange={(v) => setForm({ ...form, department: v })} />
            <SelectField label="Education" value={String(form.education)} options={[...EDUCATION]} onChange={(v) => setForm({ ...form, education: v })} />
            <SelectField label="Gender" value={String(form.gender)} options={[...GENDERS]} onChange={(v) => setForm({ ...form, gender: v })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {SLIDERS.map((s) => (
              <SliderField
                key={s.feature}
                label={s.label}
                min={s.min}
                max={s.max}
                step={s.step}
                value={Number(form[s.feature])}
                onChange={(v) => setForm({ ...form, [s.feature]: v })}
              />
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={predict} className="btn-primary">
              <Sparkles className="w-4 h-4" /> Predict Performance
            </button>
            <button onClick={reset} className="btn-ghost">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <ResultCard result={result} />
          ) : (
            <div className="card p-8 text-center text-slate-400 h-full flex flex-col items-center justify-center">
              <Sparkles className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm">Set the employee profile and click <span className="font-medium text-slate-600">Predict</span> to see the projected band and key drivers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: ReturnType<typeof explainPrediction> }) {
  const band = result.band;
  const segments = (["Low", "Medium", "High"] as PerfBand[]).map((b) => ({
    label: b,
    value: result.probabilities[b],
    color: BAND_COLORS[b],
  }));

  return (
    <>
      <div className="card p-5">
        <h3 className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Predicted Band</h3>
        <div className="flex items-center gap-5 flex-wrap">
          <DonutChart
            segments={segments}
            centerLabel={band}
            centerSub="forecast"
            size={150}
          />
          <div className="space-y-2 flex-1 min-w-[140px]">
            {(["High", "Medium", "Low"] as PerfBand[]).map((b) => (
              <div key={b} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BAND_COLORS[b] }} />
                  <span className="text-slate-700">{b}</span>
                </span>
                <span className="font-medium tabular-nums">{fmtPct(result.probabilities[b])}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: `rgba(${band === "High" ? "16,185,129" : band === "Medium" ? "245,158,11" : "239,68,68"}, 0.08)` }}>
          <span className={`chip ${BAND_BG[band]} mb-1`}>{band} performer</span>
          <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">
            {band === "High"
              ? "Strong across delivery, quality, and engagement. Retain and grow."
              : band === "Medium"
              ? "Mixed signals — target the top 2–3 drivers below in the next cycle."
              : "At-risk profile. Initiate a structured improvement plan focused on the drivers below."}
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Key Drivers</h3>
        <BarChart
          bars={result.drivers.map((d) => ({
            label: prettify(d.feature),
            value: d.contribution,
            color: d.contribution >= 0 ? "#0d9488" : "#dc2626",
          }))}
          format={(v) => (v >= 0 ? "+" : "") + v.toFixed(3)}
          height={200}
        />
        <p className="text-[11px] text-slate-400 mt-3">
          Teal bars push the prediction toward <span className="text-emerald-600 font-medium">High</span>; red bars push toward <span className="text-rose-600 font-medium">Low</span>. Contributions are averaged across all trees in the forest.
        </p>
      </div>

      {result.recommendations.length > 0 && (
        <div className="card p-5">
          <h3 className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Recommended Actions
          </h3>
          <ul className="space-y-2">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <ArrowRight className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-slate-600 font-medium">{label}</label>
        <span className="text-xs font-semibold text-slate-800 tabular-nums bg-slate-100 px-2 py-0.5 rounded">
          {value.toFixed(step < 1 ? (step <= 0.01 ? 2 : 1) : 0)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-slate-800 h-1.5 cursor-pointer"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-slate-600 font-medium block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
