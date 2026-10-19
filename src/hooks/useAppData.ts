import { useEffect, useState } from "react";
import { generateEmployees } from "@/lib/data";
import { trainModel, type TrainedModel } from "@/lib/model";
import type { Employee } from "@/lib/types";

export interface AppData {
  employees: Employee[];
  model: TrainedModel;
}

/**
 * Generates the synthetic HR dataset immediately and trains the in-browser
 * random forest in a deferred effect so a loading state can paint first.
 */
export function useAppData(n = 1200): AppData | null {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const employees = generateEmployees(n, 13);
      const model = trainModel(employees);
      setData({ employees, model });
    });
    return () => cancelAnimationFrame(id);
  }, [n]);

  return data;
}
