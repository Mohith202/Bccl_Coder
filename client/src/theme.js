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

export function normalizeCategory(name) {
  if (typeof name !== "string") return String(name);
  const k = name.trim().toLowerCase();
  return CATEGORY_ALIASES[k] || k;
}

export const PLOTLY_LAYOUT = {
  margin: { l: 50, r: 20, t: 50, b: 50 },
  font: { family: "Space Grotesk, sans-serif", size: 12, color: "#1b2533" },
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(255,255,255,0.6)",
  hoverlabel: { bgcolor: "#0e1623", font: { color: "#fff" } },
  colorway: [
    "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#14b8a6", "#f43f5e", "#22c55e", "#3b82f6",
  ],
};

export const PLOTLY_CONFIG = {
  displaylogo: false,
  responsive: true,
  toImageButtonOptions: { format: "png", filename: "chart", scale: 2 },
  modeBarButtonsToRemove: ["lasso2d", "select2d"],
};

export function applyTheme(layout = {}) {
  return { ...PLOTLY_LAYOUT, ...layout };
}
