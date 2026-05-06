import { Router } from "express";
import { EXPERIMENTS, AVAILABLE_METRICS, DEFAULT_METRIC, CATEGORY_COLORS, CATEGORY_ALIASES } from "../config.js";
import { experimentDir } from "../utils/paths.js";
import fs from "node:fs";

const r = Router();

r.get("/experiments", (_req, res) => {
  const list = Object.entries(EXPERIMENTS).map(([key, cfg]) => {
    const dir = experimentDir(key);
    return { key, ...cfg, exists: dir ? fs.existsSync(dir) : false, path: dir };
  });
  res.json({
    data: list,
    meta: {
      metrics: AVAILABLE_METRICS,
      defaultMetric: DEFAULT_METRIC,
      colors: CATEGORY_COLORS,
      aliases: CATEGORY_ALIASES,
    },
  });
});

export default r;
