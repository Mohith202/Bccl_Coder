// Shared registry consumed by both server and client (duplicated client-side).
export const EXPERIMENTS = {
  llama_finetune: {
    label: "Llama-3.2-3B Fine-tune",
    folder: "swati_llama_finetune",
    model_family: "Llama",
    kind: "finetune",
    has_categories: true,
  },
  qwen_regional: {
    label: "Qwen3-4B Regional Analysis",
    folder: "regions_output/a1_features_qwen3_4b",
    model_family: "Qwen",
    kind: "regional",
    has_categories: true,
  },
  qwen_roi31: {
    label: "Qwen3-4B ROI-31 Set",
    folder: "qwen_31_finetune",
    model_family: "Qwen",
    kind: "roi_set",
    has_categories: true,
  },
  alpha_sweep: {
    label: "Alpha Hyperparameter Sweep (HO-31)",
    folder: "ds005345-a1-results/ho31_alpha_sweep",
    model_family: "Qwen",
    kind: "alpha_sweep",
    has_categories: false,
  },
  bootstrap_membership: {
    label: "Bootstrap ROI Membership (7-ROI)",
    folder: "7ROI_outputs",
    model_family: "Mixed",
    kind: "membership",
    has_categories: true,
  },
};

export const CATEGORY_COLORS = {
  single_male: "#1f77b4",
  single_female: "#d62728",
  mixed_male: "#17becf",
  mixed_female: "#e377c2",
};

export const CATEGORY_ALIASES = {
  single_m: "single_male",
  single_f: "single_female",
  mixed_m: "mixed_male",
  mixed_f: "mixed_female",
  single_m_top10: "single_male",
  single_f_top10: "single_female",
  mixed_m_top10: "mixed_male",
  mixed_f_top10: "mixed_female",
};

export const AVAILABLE_METRICS = [
  "mean_corr",
  "median_corr",
  "mean_r2",
  "two_v_two_accuracy",
  "mean_2v2_accuracy",
];

export const DEFAULT_METRIC = "mean_corr";
