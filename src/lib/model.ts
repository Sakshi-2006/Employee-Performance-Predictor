import type { Employee, PerfBand, ModelFeature, PredictionResult } from "./types";
import { NUMERIC_FEATURES } from "./types";

const BANDS: PerfBand[] = ["Low", "Medium", "High"];

interface TrainedTree {
  feature: ModelFeature | null;
  threshold: number;
  left: TrainedTree | null;
  right: TrainedTree | null;
  value: number[]; // [pLow, pMedium, pHigh]
}

type Sample = number[]; // numeric features followed by band index (0/1/2)

interface TrainedForest {
  trees: TrainedTree[];
  featureImportance: Record<ModelFeature, number>;
  bandPriors: number[];
}

export interface ModelMetrics {
  accuracy: number;
  macroF1: number;
  perClassF1: Record<PerfBand, number>;
  confusion: Record<PerfBand, Record<PerfBand, number>>;
  testSize: number;
}

export interface TrainedModel {
  forest: TrainedForest;
  metrics: ModelMetrics;
  featureStats: Record<ModelFeature, { mean: number; std: number }>;
}

function bandIndex(b: PerfBand): number {
  return b === "Low" ? 0 : b === "Medium" ? 1 : 2;
}

function gini(samples: Sample[]): number {
  if (samples.length === 0) return 0;
  const counts = [0, 0, 0];
  for (const s of samples) counts[s[s.length - 1]]++;
  const n = samples.length;
  let imp = 1;
  for (const c of counts) {
    const p = c / n;
    imp -= p * p;
  }
  return imp;
}

function bestSplit(
  samples: Sample[],
  featureIdx: number,
  _features: ModelFeature[]
): { threshold: number; gain: number } {
  const values = samples.map((s) => s[featureIdx]).sort((a, b) => a - b);
  let best = { threshold: 0, gain: -Infinity };
  const parentImpurity = gini(samples);
  const n = samples.length;

  for (let i = 1; i < values.length; i++) {
    const threshold = (values[i - 1] + values[i]) / 2;
    const left = samples.filter((s) => s[featureIdx] <= threshold);
    const right = samples.filter((s) => s[featureIdx] > threshold);
    if (left.length === 0 || right.length === 0) continue;
    const gain =
      parentImpurity -
      (left.length / n) * gini(left) -
      (right.length / n) * gini(right);
    if (gain > best.gain) best = { threshold, gain };
  }
  return best;
}

function buildTree(
  samples: Sample[],
  features: ModelFeature[],
  depth: number,
  maxDepth: number,
  minSamples: number,
  featureSample: ModelFeature[]
): TrainedTree {
  const majority = [0, 0, 0];
  for (const s of samples) majority[s[s.length - 1]]++;
  const value = majority.map((c) => c / samples.length);

  if (depth >= maxDepth || samples.length < minSamples || gini(samples) < 0.02) {
    return { feature: null, threshold: 0, left: null, right: null, value };
  }

  let bestFeature: ModelFeature | null = null;
  let bestSplitRes = { threshold: 0, gain: -Infinity };
  let bestFeatureIdx = -1;

  for (const fi of featureSample) {
    const idx = features.indexOf(fi);
    const split = bestSplit(samples, idx, features);
    if (split.gain > bestSplitRes.gain) {
      bestSplitRes = split;
      bestFeature = fi;
      bestFeatureIdx = idx;
    }
  }

  if (!bestFeature || bestSplitRes.gain <= 0) {
    return { feature: null, threshold: 0, left: null, right: null, value };
  }

  const left = samples.filter((s) => s[bestFeatureIdx] <= bestSplitRes.threshold);
  const right = samples.filter((s) => s[bestFeatureIdx] > bestSplitRes.threshold);

  return {
    feature: bestFeature,
    threshold: bestSplitRes.threshold,
    left: buildTree(left, features, depth + 1, maxDepth, minSamples, featureSample),
    right: buildTree(right, features, depth + 1, maxDepth, minSamples, featureSample),
    value,
  };
}

function predictTree(tree: TrainedTree, row: Record<ModelFeature, number>): number[] {
  if (!tree.feature || !tree.left || !tree.right) return tree.value;
  if (row[tree.feature] <= tree.threshold) return predictTree(tree.left, row);
  return predictTree(tree.right, row);
}

function sampleFeatures(features: ModelFeature[], k: number, r: () => number): ModelFeature[] {
  const copy = [...features];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, k);
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function employeeToRow(e: Employee): Record<ModelFeature, number> {
  const row = {} as Record<ModelFeature, number>;
  for (const f of NUMERIC_FEATURES) {
    row[f] = Number(e[f]);
  }
  return row;
}

function employeeToVector(e: Employee): Sample {
  return [...NUMERIC_FEATURES.map((f) => Number(e[f])), bandIndex(e.perf_band_next)];
}

/**
 * Trains a compact random-forest-style classifier entirely in the browser.
 * Returns the model + hold-out metrics (accuracy, macro-F1, confusion matrix).
 */
export function trainModel(employees: Employee[]): TrainedModel {
  const vectors = employees.map(employeeToVector);
  const r = mulberry32(42);

  // Stratified-ish shuffle + 80/20 split
  const shuffled = [...vectors].sort(() => r() - 0.5);
  const splitIdx = Math.floor(shuffled.length * 0.8);
  const train = shuffled.slice(0, splitIdx);
  const test = shuffled.slice(splitIdx);

  const nTrees = 40;
  const maxDepth = 9;
  const minSamples = 6;
  const featureCount = Math.floor(Math.sqrt(NUMERIC_FEATURES.length));

  const trees: TrainedTree[] = [];
  const importance: Record<ModelFeature, number> = {} as Record<ModelFeature, number>;
  for (const f of NUMERIC_FEATURES) importance[f] = 0;

  for (let t = 0; t < nTrees; t++) {
    // bootstrap sample
    const boot: Sample[] = [];
    for (let i = 0; i < train.length; i++) {
      boot.push(train[Math.floor(r() * train.length)]);
    }
    const feats = sampleFeatures(NUMERIC_FEATURES, featureCount, r);
    const tree = buildTree(boot, NUMERIC_FEATURES, 0, maxDepth, minSamples, feats);
    trees.push(tree);
    if (tree.feature) importance[tree.feature] += 1;
  }

  // normalize importance
  const totalImp = Object.values(importance).reduce((a, b) => a + b, 0) || 1;
  for (const f of NUMERIC_FEATURES) importance[f] /= totalImp;

  // band priors from train
  const priors = [0, 0, 0];
  for (const s of train) priors[s[s.length - 1]]++;
  const bandPriors = priors.map((c) => c / train.length);

  const forest: TrainedForest = { trees, featureImportance: importance, bandPriors };

  // evaluate on test
  const confusion: Record<PerfBand, Record<PerfBand, number>> = {
    Low: { Low: 0, Medium: 0, High: 0 },
    Medium: { Low: 0, Medium: 0, High: 0 },
    High: { Low: 0, Medium: 0, High: 0 },
  };
  let correct = 0;
  const perClass = { Low: { tp: 0, fp: 0, fn: 0 }, Medium: { tp: 0, fp: 0, fn: 0 }, High: { tp: 0, fp: 0, fn: 0 } };

  for (const s of test) {
    const row = {} as Record<ModelFeature, number>;
    for (let i = 0; i < NUMERIC_FEATURES.length; i++) row[NUMERIC_FEATURES[i]] = s[i];
    const actual = BANDS[s[s.length - 1]];
    const pred = predictForest(forest, row);
    confusion[actual][pred]++;
    if (actual === pred) correct++;
    if (actual === pred) perClass[actual].tp++;
    else {
      perClass[pred].fp++;
      perClass[actual].fn++;
    }
  }

  const perClassF1 = {} as Record<PerfBand, number>;
  for (const b of BANDS) {
    const { tp, fp, fn } = perClass[b];
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    perClassF1[b] = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  }
  const macroF1 = (perClassF1.Low + perClassF1.Medium + perClassF1.High) / 3;

  // feature stats for standardization
  const featureStats = {} as Record<ModelFeature, { mean: number; std: number }>;
  for (const f of NUMERIC_FEATURES) {
    const vals = train.map((s) => s[NUMERIC_FEATURES.indexOf(f)]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    featureStats[f] = { mean, std: Math.sqrt(variance) || 1 };
  }

  return {
    forest,
    metrics: {
      accuracy: correct / test.length,
      macroF1,
      perClassF1,
      confusion,
      testSize: test.length,
    },
    featureStats,
  };
}

export function predictForest(forest: TrainedForest, row: Record<ModelFeature, number>): PerfBand {
  const probs = predictForestProba(forest, row);
  let best = 0;
  let bestP = -1;
  for (let i = 0; i < 3; i++) {
    if (probs[i] > bestP) {
      bestP = probs[i];
      best = i;
    }
  }
  return BANDS[best];
}

export function predictForestProba(forest: TrainedForest, row: Record<ModelFeature, number>): [number, number, number] {
  const sum = [0, 0, 0];
  for (const tree of forest.trees) {
    const v = predictTree(tree, row);
    for (let i = 0; i < 3; i++) sum[i] += v[i];
  }
  const total = sum[0] + sum[1] + sum[2] || 1;
  return [sum[0] / total, sum[1] / total, sum[2] / total];
}

/**
 * Approximates SHAP-style local contributions by walking each tree and
 * attributing the change in class-probability mass to the feature used at
 * each split. Drivers are signed relative to the "High" class probability.
 */
export function explainPrediction(model: TrainedModel, row: Record<ModelFeature, number>): PredictionResult {
  const probs = predictForestProba(model.forest, row);
  const band: PerfBand = probs[2] > probs[1] ? (probs[2] > probs[0] ? "High" : "Low") : probs[1] > probs[0] ? "Medium" : "Low";

  const contribs: Record<ModelFeature, number> = {} as Record<ModelFeature, number>;
  for (const f of NUMERIC_FEATURES) contribs[f] = 0;

  for (const tree of model.forest.trees) {
    walkTreeContribution(tree, row, tree.value, contribs);
  }

  const drivers = NUMERIC_FEATURES.map((f) => ({
    feature: f,
    contribution: contribs[f] / model.forest.trees.length,
    value: row[f],
  }))
    .filter((d) => Math.abs(d.contribution) > 0.001)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 8);

  const recommendations = buildRecommendations(drivers, band);
  return {
    band,
    probabilities: { Low: probs[0], Medium: probs[1], High: probs[2] },
    drivers,
    recommendations,
  };
}

function walkTreeContribution(
  tree: TrainedTree,
  row: Record<ModelFeature, number>,
  parentValue: number[],
  contribs: Record<ModelFeature, number>
): void {
  if (!tree.feature || !tree.left || !tree.right) return;
  const child = row[tree.feature] <= tree.threshold ? tree.left : tree.right;
  // contribution = change in P(High) from parent to child
  const delta = child.value[2] - parentValue[2];
  contribs[tree.feature] += delta;
  walkTreeContribution(child, row, child.value, contribs);
}

function buildRecommendations(
  drivers: { feature: ModelFeature; contribution: number; value: number }[],
  band: PerfBand
): string[] {
  const recs: string[] = [];
  const negatives = drivers.filter((d) => d.contribution < 0).sort((a, b) => a.contribution - b.contribution);

  for (const d of negatives.slice(0, 3)) {
    const msg = RECOMMENDATION_MAP[d.feature];
    if (msg) recs.push(msg);
  }

  if (band === "Low") {
    recs.push("Schedule a structured 30-day performance improvement plan with weekly check-ins.");
  } else if (band === "Medium") {
    recs.push("Pair with a high performer on the next sprint to lift delivery and peer feedback.");
  } else {
    recs.push("Consider for stretch assignment or promotion-readiness review in the next cycle.");
  }

  if (recs.length === 0) recs.push("No major risk drivers — continue current coaching cadence.");
  return recs;
}

const RECOMMENDATION_MAP: Partial<Record<ModelFeature, string>> = {
  on_time_delivery_rate: "Enroll in a Sprint Planning & Estimation workshop to improve on-time delivery.",
  avg_task_delay_days: "Assign a mentor for task breakdown and blocker escalation to reduce delays.",
  bug_count: "Initiate pair programming and a code-quality refresher to reduce defect count.",
  code_review_score: "Provide structured code-review training and add a senior reviewer to PRs.",
  qa_defect_density: "Add unit-test coverage goals and a pre-merge QA gate.",
  training_hours: "Assign a targeted certification track (e.g., AWS CCP / Azure DP-900) to grow skills.",
  certifications_count: "Sponsor a role-relevant certification to deepen domain credibility.",
  peer_feedback_score: "Facilitate a peer-feedback and collaboration workshop.",
  manager_score: "Set bi-weekly 1:1s with clear goal alignment and action items.",
  kudos_count: "Increase visibility by routing kudos through team standups and recognition channels.",
  story_points_completed: "Rebalance workload; investigate blockers limiting throughput.",
  billable_hours_ratio: "Audit non-billable time sinks and reallocate to project work.",
  sick_days: "Check in on wellbeing; review workload and offer flexible scheduling.",
  unplanned_absences: "Clarify attendance expectations and identify root causes in a 1:1.",
  promotions_in_2y: "Discuss career path and define promotion criteria for the next cycle.",
  manager_tenure_years: "Stabilize reporting line; long manager tenure correlates with stronger ratings.",
};
