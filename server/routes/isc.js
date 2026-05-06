import { Router } from "express";
import { loadCsvOr404, loadJsonOr404 } from "../utils/routes.js";

const r = Router();

r.get("/:exp/isc-summary", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "isc_summary_by_category.csv",
  ])
);

r.get("/:exp/isc-voxel-mapping", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "top10_isc_voxel_mapping.csv",
  ])
);

r.get("/:exp/isc-regional-stats", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "top10_isc_regional_stats.csv",
  ])
);

r.get("/:exp/top-voxels-summary", (req, res) =>
  loadJsonOr404(res, req.params.exp, [
    "top_voxels/summary.json",
  ])
);

export default r;
