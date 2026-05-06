import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { experimentDir } from "../utils/paths.js";
import { readCsv } from "../utils/csv.js";
import { readJson } from "../utils/json.js";

const r = Router();

// Returns sweep results for ho31_alpha_sweep.
r.get("/alpha-sweep", (_req, res) => {
  const dir = experimentDir("alpha_sweep");
  if (!dir || !fs.existsSync(dir)) {
    return res.status(404).json({ error: "file_not_found", expectedPath: dir });
  }
  const alphas = fs.readdirSync(dir).filter(n => /^alpha_\d+$/.test(n)).sort((a, b) => {
    return parseInt(a.split("_")[1], 10) - parseInt(b.split("_")[1], 10);
  });
  const result = alphas.map(name => {
    const sub = path.join(dir, name);
    const candidates = {
      best_layer: ["fit_results/core_roi_best_layer_summary.csv", "core_roi_best_layer_summary.csv"],
      layer_summary: ["fit_results/core_roi_layer_summary.csv", "core_roi_layer_summary.csv"],
      summary_json: ["fit_run_summary.json", "end_to_end_summary.json"],
    };
    const entry = { alpha: parseInt(name.split("_")[1], 10), folder: sub };
    for (const [k, list] of Object.entries(candidates)) {
      for (const rel of list) {
        const abs = path.join(sub, rel);
        if (fs.existsSync(abs)) {
          entry[k] = abs.endsWith(".json") ? readJson(abs) : readCsv(abs)?.rows;
          entry[`${k}_source`] = abs;
          break;
        }
      }
    }
    return entry;
  });
  res.json({ data: result, meta: { count: result.length, root: dir } });
});

export default r;
