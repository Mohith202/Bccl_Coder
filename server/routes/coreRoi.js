import { Router } from "express";
import { loadCsvOr404 } from "../utils/routes.js";

const r = Router();

r.get("/:exp/core-roi", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "fit_results/core_roi_scores_all.csv",
    "core_roi_scores_all.csv",
    "fit_results/core_roi_layer_summary.csv",
    "core_roi_layer_summary.csv",
  ])
);

r.get("/:exp/core-roi/layer-summary", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "fit_results/core_roi_layer_summary.csv",
    "core_roi_layer_summary.csv",
  ])
);

r.get("/:exp/core-roi/best-layer", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "fit_results/core_roi_best_layer_summary.csv",
    "core_roi_best_layer_summary.csv",
  ])
);

export default r;
