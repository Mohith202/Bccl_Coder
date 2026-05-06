import { Router } from "express";
import { loadCsvOr404, loadJsonOr404 } from "../utils/routes.js";

const r = Router();

r.get("/:exp/bootstrap/membership", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "roi_category_membership.csv",
    "a1_bootstrap/roi_category_membership.csv",
  ])
);

r.get("/:exp/bootstrap/summary", (req, res) =>
  loadJsonOr404(res, req.params.exp, [
    "a1_bootstrap/bootstrap_summary.json",
    "bootstrap_summary.json",
  ])
);

export default r;
