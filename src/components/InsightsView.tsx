import { useMemo } from "react";
import type { TrainedModel } from "@/lib/model";
import type { Employee } from "@/lib/types";
import { NUMERIC_FEATURES, type ModelFeature } from "@/lib/types";
import { BarChart } from "./BarChart";
import { ConfusionMatrix } from "./ConfusionMatrix";
import { prettify } from "./ui";
import { Brain, GitBranch, ShieldCheck, Lightbulb } from "lucide-react";

interface Props {
  model: TrainedModel;
  employees: Employee[];
}

export function InsightsView({ model, employees }: Props) {
  const importance = model.forest.featureImportance;
  const topFeatures = useMemo(
    () =>
      [...NUMERIC_FEATURES]
        .map((f) => ({ feature: f, imp: importance[f] }))
        .sort((a, b) => b.imp - a.imp)
        .slice(0, 12),
    [importance]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Feature importance */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-teal-600" />
          <h2 className="font-semibold text-slate-800">Feature Importance</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          How often each feature is used for splits across {model.forest.trees.length} trees — a global view of what drives predictions
        </p>
        <BarChart
          bars={topFeatures.map((f) => ({
            label: prettify(f.feature),
            value: f.imp,
            color: "#0f766e",
          }))}
          format={(v) => fmtPctInline(v)}
          height={320}
        />
      </div>

      {/* Confusion matrix + interpretation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-4 h-4 text-slate-600" />
            <h2 className="font-semibold text-slate-800">Confusion Matrix</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Hold-out test set ({model.metrics.testSize} rows)</p>
          <div className="flex justify-center">
            <ConfusionMatrix confusion={model.metrics.confusion} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div>
              <div className="text-lg font-bold text-slate-900">{(model.metrics.accuracy * 100).toFixed(1)}%</div>
              <div className="text-[10px] text-slate-500 uppercase">Accuracy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">{model.metrics.macroF1.toFixed(3)}</div>
              <div className="text-[10px] text-slate-500 uppercase">Macro F1</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">{model.forest.trees.length}</div>
              <div className="text-[10px] text-slate-500 uppercase">Trees</div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="font-semibold text-slate-800">Interpretation</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">What the model learned and where it struggles</p>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              <span className="font-medium text-slate-800">Top driver:</span>{" "}
              {prettify(topFeatures[0].feature)} ({fmtPctInline(topFeatures[0].imp)} of split decisions). Work-output
              signals dominate demographic features, which is the desired behaviour for a fair HR model.
            </p>
            <p>
              <span className="font-medium text-slate-800">Hardest band:</span>{" "}
              {hardestBand(model).band} (F1 {(model.metrics.perClassF1[hardestBand(model).band] * 100).toFixed(1)}%).
              Middle-band employees sit near decision boundaries and are most easily confused with neighbours.
            </p>
            <p>
              <span className="font-medium text-slate-800">Reliability:</span> macro-F1 of{" "}
              {model.metrics.macroF1.toFixed(3)} on a stratified hold-out set indicates the model generalises — not
              memorising the training rows. The synthetic target was generated with Gaussian noise so perfect accuracy
              is neither expected nor desirable.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations mapping */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-slate-800">Driver → Action Mapping</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">Rule templates that convert a low feature value into a concrete intervention</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RECS.map((r, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-semibold text-slate-800 mb-1">{prettify(r.feature)}</div>
              <div className="text-xs text-slate-600 leading-relaxed">{r.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function fmtPctInline(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function hardestBand(model: TrainedModel): { band: "High" | "Medium" | "Low" } {
  const f = model.metrics.perClassF1;
  let worst: "High" | "Medium" | "Low" = "Medium";
  if (f.Low < f[worst]) worst = "Low";
  if (f.High < f[worst]) worst = "High";
  return { band: worst };
}

const RECS: { feature: ModelFeature; action: string }[] = [
  { feature: "on_time_delivery_rate", action: "Enroll in a Sprint Planning & Estimation workshop to improve on-time delivery." },
  { feature: "avg_task_delay_days", action: "Assign a mentor for task breakdown and blocker escalation to reduce delays." },
  { feature: "bug_count", action: "Initiate pair programming and a code-quality refresher to reduce defect count." },
  { feature: "code_review_score", action: "Provide structured code-review training and add a senior reviewer to PRs." },
  { feature: "qa_defect_density", action: "Add unit-test coverage goals and a pre-merge QA gate." },
  { feature: "training_hours", action: "Assign a targeted certification track (AWS CCP / Azure DP-900) to grow skills." },
  { feature: "peer_feedback_score", action: "Facilitate a peer-feedback and collaboration workshop." },
  { feature: "manager_score", action: "Set bi-weekly 1:1s with clear goal alignment and action items." },
  { feature: "story_points_completed", action: "Rebalance workload; investigate blockers limiting throughput." },
  { feature: "sick_days", action: "Check in on wellbeing; review workload and offer flexible scheduling." },
];
