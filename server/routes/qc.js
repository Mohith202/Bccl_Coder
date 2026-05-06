import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { experimentDir } from "../utils/paths.js";
import { readJson } from "../utils/json.js";
import { findFilesRecursive } from "../utils/routes.js";

const r = Router();

const QC_FILES = [
  "alignment_qc.json",
  "analysis_mask_qc.json",
  "annotation_qc.json",
  "core_roi_qc.json",
  "feature_extraction_qc.json",
  "manifest_qc.json",
];

r.get("/:exp/qc", (req, res) => {
  const dir = experimentDir(req.params.exp);
  if (!dir) return res.status(404).json({ error: "unknown_experiment" });
  const out = {};
  for (const name of QC_FILES) {
    // Check fixed locations first, then recurse.
    const fixed = [path.join(dir, name), path.join(dir, "a1_bootstrap", name)];
    let found = fixed.find(p => fs.existsSync(p));
    if (!found) {
      const hits = findFilesRecursive(dir, name);
      found = hits[0];
    }
    if (found) out[name] = { source: found, data: readJson(found) };
  }
  res.json({ data: out, meta: { keys: Object.keys(out), root: dir } });
});

export default r;
