import type { PerfBand } from "@/lib/types";
import { BAND_COLORS } from "./ui";

interface Props {
  confusion: Record<PerfBand, Record<PerfBand, number>>;
}

const BANDS: PerfBand[] = ["Low", "Medium", "High"];

export function ConfusionMatrix({ confusion }: Props) {
  const max = Math.max(
    ...BANDS.flatMap((actual) => BANDS.map((pred) => confusion[actual][pred])),
    1
  );
  return (
    <div className="inline-block">
      <div className="grid grid-cols-[auto_repeat(3,1fr)] gap-1 text-xs">
        <div></div>
        {BANDS.map((b) => (
          <div key={b} className="text-center font-medium text-slate-500 pb-1">
            Pred {b}
          </div>
        ))}
        {BANDS.map((actual) => (
          <div key={actual} className="contents">
            <div className="text-right font-medium text-slate-500 pr-2 self-center">Actual {actual}</div>
            {BANDS.map((pred) => {
              const v = confusion[actual][pred];
              const intensity = v / max;
              const correct = actual === pred;
              return (
                <div
                  key={pred}
                  className="w-16 h-14 rounded-md flex flex-col items-center justify-center text-center"
                  style={{
                    backgroundColor: correct
                      ? `rgba(16, 185, 129, ${0.15 + intensity * 0.6})`
                      : `rgba(239, 68, 68, ${0.08 + intensity * 0.45})`,
                  }}
                >
                  <span className="font-bold tabular-nums text-slate-800">{v}</span>
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: BAND_COLORS[pred] }}
                  >
                    {pred}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
