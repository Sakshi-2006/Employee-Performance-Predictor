import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { DashboardView } from "@/components/DashboardView";
import { EDAView } from "@/components/EDAView";
import { PredictorView } from "@/components/PredictorView";
import { InsightsView } from "@/components/InsightsView";
import { FairnessView } from "@/components/FairnessView";
import { Gauge, BarChart3, Sparkles, Brain, Scale, Loader2 } from "lucide-react";

type Tab = "dashboard" | "eda" | "predictor" | "insights" | "fairness";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Overview", icon: <Gauge className="w-4 h-4" /> },
  { id: "eda", label: "EDA", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "predictor", label: "Predictor", icon: <Sparkles className="w-4 h-4" /> },
  { id: "insights", label: "Model Insights", icon: <Brain className="w-4 h-4" /> },
  { id: "fairness", label: "Fairness Audit", icon: <Scale className="w-4 h-4" /> },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const data = useAppData(1200);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-slate-900 text-sm sm:text-base">Employee Performance Predictor</div>
              <div className="text-[11px] text-slate-500 hidden sm:block">People analytics · synthetic HR simulation</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
            <span className="chip bg-slate-100 text-slate-600">Random Forest</span>
            <span className="chip bg-slate-100 text-slate-600">{data ? `${data.employees.length} employees` : "loading"}</span>
          </div>
        </div>
        {/* Tabs */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                tab === t.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!data ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-500" />
            <p className="text-sm">Generating synthetic workforce and training model…</p>
          </div>
        ) : (
          <>
            {tab === "dashboard" && data && <DashboardView employees={data.employees} model={data.model} />}
            {tab === "eda" && data && <EDAView employees={data.employees} />}
            {tab === "predictor" && data && <PredictorView model={data.model} employees={data.employees} />}
            {tab === "insights" && data && <InsightsView model={data.model} employees={data.employees} />}
            {tab === "fairness" && data && <FairnessView employees={data.employees} />}
          </>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-slate-400">
        Built for educational purposes — synthetic data, in-browser random forest. Decisions augment, not replace, human judgement.
      </footer>
    </div>
  );
}
