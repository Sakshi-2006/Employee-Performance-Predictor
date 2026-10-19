export type PerfBand = "High" | "Medium" | "Low";

export interface Employee {
  employee_id: string;
  age: number;
  gender: "Male" | "Female" | "Non-binary";
  education: "Bachelors" | "Masters" | "PhD" | "Diploma";
  experience_years: number;
  department: "Engineering" | "Sales" | "Marketing" | "Operations" | "Finance" | "HR";
  job_level: 1 | 2 | 3 | 4 | 5;
  manager_tenure_years: number;
  projects_count: number;
  avg_task_delay_days: number;
  on_time_delivery_rate: number; // 0..1
  bug_count: number;
  code_review_score: number; // 1..5
  qa_defect_density: number;
  story_points_completed: number;
  billable_hours_ratio: number; // 0..1
  training_hours: number;
  certifications_count: number;
  internal_hackathons_participated: number;
  sick_days: number;
  unplanned_absences: number;
  avg_login_hours: number;
  peer_feedback_score: number; // 1..5
  manager_score: number; // 1..5
  kudos_count: number;
  promotions_in_2y: number;
  salary_percentile_band: 1 | 2 | 3 | 4 | 5;
  perf_band_next: PerfBand;
}

export type ModelFeature =
  | "experience_years"
  | "job_level"
  | "manager_tenure_years"
  | "projects_count"
  | "avg_task_delay_days"
  | "on_time_delivery_rate"
  | "bug_count"
  | "code_review_score"
  | "qa_defect_density"
  | "story_points_completed"
  | "billable_hours_ratio"
  | "training_hours"
  | "certifications_count"
  | "internal_hackathons_participated"
  | "sick_days"
  | "unplanned_absences"
  | "avg_login_hours"
  | "peer_feedback_score"
  | "manager_score"
  | "kudos_count"
  | "promotions_in_2y"
  | "salary_percentile_band";

export const NUMERIC_FEATURES: ModelFeature[] = [
  "experience_years",
  "job_level",
  "manager_tenure_years",
  "projects_count",
  "avg_task_delay_days",
  "on_time_delivery_rate",
  "bug_count",
  "code_review_score",
  "qa_defect_density",
  "story_points_completed",
  "billable_hours_ratio",
  "training_hours",
  "certifications_count",
  "internal_hackathons_participated",
  "sick_days",
  "unplanned_absences",
  "avg_login_hours",
  "peer_feedback_score",
  "manager_score",
  "kudos_count",
  "promotions_in_2y",
  "salary_percentile_band",
];

export const CATEGORICAL_FEATURES = [
  "department",
  "education",
  "gender",
] as const;

export interface PredictionResult {
  band: PerfBand;
  probabilities: Record<PerfBand, number>;
  drivers: { feature: ModelFeature; contribution: number; value: number }[];
  recommendations: string[];
}
