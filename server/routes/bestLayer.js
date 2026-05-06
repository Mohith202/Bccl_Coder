import { Router } from "express";
import { loadCsvOr404 } from "../utils/routes.js";

const r = Router();

r.get("/:exp/best-layer-vs-nc", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "fit_results/best_layer_vs_noise_ceiling.csv",
    "best_layer_vs_noise_ceiling.csv",
  ])
);

r.get("/:exp/noise-ceiling", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "fit_results/noise_ceiling_core_roi_summary.csv",
    "noise_ceiling_core_roi_summary.csv",
  ])
);

export default r;
