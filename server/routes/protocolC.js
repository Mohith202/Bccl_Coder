import { Router } from "express";
import { loadCsvOr404 } from "../utils/routes.js";

const r = Router();

r.get("/:exp/protocol-c", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "fit_results/protocol_c_core_roi_scores.csv",
    "protocol_c_core_roi_scores.csv",
  ])
);

export default r;
