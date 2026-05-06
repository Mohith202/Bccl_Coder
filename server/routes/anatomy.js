import { Router } from "express";
import { loadCsvOr404 } from "../utils/routes.js";

const r = Router();

r.get("/:exp/anatomy/:k(\\d+)", (req, res) => {
  const k = req.params.k;
  loadCsvOr404(res, req.params.exp, [
    `top_voxels/anatomy_top${k}.csv`,
    `anatomy_top${k}.csv`,
  ]);
});

r.get("/:exp/jaccard", (req, res) =>
  loadCsvOr404(res, req.params.exp, [
    "top_voxels/cross_category_jaccard.csv",
    "cross_category_jaccard.csv",
  ])
);

export default r;
