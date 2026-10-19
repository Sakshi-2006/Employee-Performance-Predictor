import type { Employee, PerfBand } from "./types";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function sample<T>(arr: readonly T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function gauss(r: () => number, mean: number, std: number): number {
  const u1 = Math.max(r(), 1e-9);
  const u2 = r();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function round(x: number, d = 2): number {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Operations", "Finance", "HR"] as const;
const EDUCATION = ["Bachelors", "Masters", "PhD", "Diploma"] as const;
const GENDERS = ["Male", "Female", "Non-binary"] as const;

/**
 * Generates a synthetic HR dataset that mimics realistic correlations between
 * employee work signals and their next-cycle performance band. The target is
 * derived from a weighted score so the model has learnable signal.
 */
export function generateEmployees(n = 1200, seed = 13): Employee[] {
  const r = rng(seed);
  const employees: Employee[] = [];

  for (let i = 0; i < n; i++) {
    const gender = sample(GENDERS, r);
    const education = sample(EDUCATION, r);
    const department = sample(DEPARTMENTS, r);
    const job_level = Math.max(1, Math.min(5, Math.round(gauss(r, 2.6, 1.1)))) as 1 | 2 | 3 | 4 | 5;
    const experience_years = clamp(Math.round(gauss(r, 5 + job_level * 1.6, 3.5)), 0, 45);
    const age = 22 + experience_years + Math.round(gauss(r, 0, 2));
    const manager_tenure_years = round(clamp(gauss(r, 1.8 + job_level * 0.3, 1.5), 0, 12), 1);

    const projects_count = clamp(Math.round(gauss(r, 4 + job_level * 0.8, 2)), 0, 18);
    const on_time_delivery_rate = clamp(gauss(r, 0.78, 0.15), 0, 1);
    const avg_task_delay_days = round(clamp(gauss(r, (1 - on_time_delivery_rate) * 10, 3), -5, 45), 1);
    const bug_count = clamp(Math.round(Math.abs(gauss(r, 0, 4)) * (1.4 - on_time_delivery_rate)), 0, 40);
    const code_review_score = round(clamp(gauss(r, 3.3, 0.7), 1, 5), 1);
    const qa_defect_density = round(clamp(Math.abs(gauss(r, 1.5, 1)), 0, 12), 2);
    const story_points_completed = clamp(Math.round(gauss(r, 30 + job_level * 6, 12)), 0, 120);
    const billable_hours_ratio = round(clamp(gauss(r, 0.72, 0.12), 0, 1), 2);

    const training_hours = clamp(Math.round(Math.abs(gauss(r, 28, 18))), 0, 120);
    const certifications_count = clamp(Math.round(Math.abs(gauss(r, 1.2, 1.3))), 0, 8);
    const internal_hackathons_participated = clamp(Math.round(Math.abs(gauss(r, 1, 1.4))), 0, 8);

    const sick_days = clamp(Math.round(Math.abs(gauss(r, 3, 3))), 0, 30);
    const unplanned_absences = clamp(Math.round(Math.abs(gauss(r, 2, 2.5))), 0, 20);
    const avg_login_hours = round(clamp(gauss(r, 8.1, 0.9), 4, 12), 1);

    const peer_feedback_score = round(clamp(gauss(r, 3.5, 0.7), 1, 5), 1);
    const manager_score = round(clamp(gauss(r, 3.4, 0.8), 1, 5), 1);
    const kudos_count = clamp(Math.round(Math.abs(gauss(r, 4, 5))), 0, 40);
    const promotions_in_2y = clamp(Math.round(Math.abs(gauss(r, 0.5, 0.8))), 0, 4);
    const salary_percentile_band = clamp(Math.round(gauss(r, job_level * 0.9, 1)), 1, 5) as 1 | 2 | 3 | 4 | 5;

    // Weighted performance score — the "ground truth" we want the model to learn.
    const score =
      on_time_delivery_rate * 2.2 +
      code_review_score * 0.9 +
      peer_feedback_score * 1.1 +
      manager_score * 1.3 +
      (story_points_completed / 120) * 1.5 +
      (training_hours / 120) * 0.6 +
      (kudos_count / 40) * 0.8 +
      (certifications_count / 8) * 0.4 +
      billable_hours_ratio * 0.5 -
      bug_count * 0.08 -
      qa_defect_density * 0.18 -
      avg_task_delay_days * 0.04 -
      sick_days * 0.05 -
      unplanned_absences * 0.07 +
      promotions_in_2y * 0.4 +
      gauss(r, 0, 0.5); // noise

    let band: PerfBand;
    if (score > 8.2) band = "High";
    else if (score > 5.4) band = "Medium";
    else band = "Low";

    employees.push({
      employee_id: `EMP-${(1000 + i).toString().padStart(4, "0")}`,
      age,
      gender,
      education,
      experience_years,
      department,
      job_level,
      manager_tenure_years,
      projects_count,
      avg_task_delay_days,
      on_time_delivery_rate,
      bug_count,
      code_review_score,
      qa_defect_density,
      story_points_completed,
      billable_hours_ratio,
      training_hours,
      certifications_count,
      internal_hackathons_participated,
      sick_days,
      unplanned_absences,
      avg_login_hours,
      peer_feedback_score,
      manager_score,
      kudos_count,
      promotions_in_2y,
      salary_percentile_band,
      perf_band_next: band,
    });
  }

  return employees;
}

export function generateEmployeeFromInput(input: Record<string, number | string>): Employee {
  const id = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    employee_id: id,
    age: Number(input.age) || 30,
    gender: (input.gender as Employee["gender"]) || "Male",
    education: (input.education as Employee["education"]) || "Bachelors",
    experience_years: Number(input.experience_years) || 0,
    department: (input.department as Employee["department"]) || "Engineering",
    job_level: (Number(input.job_level) || 1) as Employee["job_level"],
    manager_tenure_years: Number(input.manager_tenure_years) || 1,
    projects_count: Number(input.projects_count) || 0,
    avg_task_delay_days: Number(input.avg_task_delay_days) || 0,
    on_time_delivery_rate: Number(input.on_time_delivery_rate) || 0,
    bug_count: Number(input.bug_count) || 0,
    code_review_score: Number(input.code_review_score) || 1,
    qa_defect_density: Number(input.qa_defect_density) || 0,
    story_points_completed: Number(input.story_points_completed) || 0,
    billable_hours_ratio: Number(input.billable_hours_ratio) || 0,
    training_hours: Number(input.training_hours) || 0,
    certifications_count: Number(input.certifications_count) || 0,
    internal_hackathons_participated: Number(input.internal_hackathons_participated) || 0,
    sick_days: Number(input.sick_days) || 0,
    unplanned_absences: Number(input.unplanned_absences) || 0,
    avg_login_hours: Number(input.avg_login_hours) || 8,
    peer_feedback_score: Number(input.peer_feedback_score) || 1,
    manager_score: Number(input.manager_score) || 1,
    kudos_count: Number(input.kudos_count) || 0,
    promotions_in_2y: Number(input.promotions_in_2y) || 0,
    salary_percentile_band: (Number(input.salary_percentile_band) || 1) as Employee["salary_percentile_band"],
    perf_band_next: "Medium",
  };
}
