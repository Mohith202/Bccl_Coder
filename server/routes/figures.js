import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { experimentDir, DATA_ROOT } from "../utils/paths.js";

const r = Router();

const FIGURE_LABELS = {
  brain_surface: "Brain surface map",
  brain_glass: "Glass brain projection",
  isc_per_category: "ISC per speaker category",
  layer_curve: "Layer-wise performance curve",
  heatmap: "ROI x layer heatmap",
};

function walkPng(root, base = root, out = []) {
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const abs = path.join(root, e.name);
    if (e.isDirectory()) walkPng(abs, base, out);
    else if (e.isFile() && /\.png$/i.test(e.name)) {
      const rel = path.relative(base, abs).replace(/\\/g, "/");
      const relFromData = path.relative(DATA_ROOT, abs).replace(/\\/g, "/");
      out.push({
        name: e.name,
        rel,
        url: `/static/figures/${relFromData}`,
        group: path.dirname(rel) || ".",
        label: labelFor(e.name),
      });
    }
  }
  return out;
}

function labelFor(name) {
  const lower = name.toLowerCase();
  for (const key of Object.keys(FIGURE_LABELS)) {
    if (lower.includes(key)) return FIGURE_LABELS[key];
  }
  return name.replace(/[_-]+/g, " ").replace(/\.png$/i, "");
}

r.get("/:exp/figures", (req, res) => {
  const dir = experimentDir(req.params.exp);
  if (!dir) return res.status(404).json({ error: "unknown_experiment" });
  if (!fs.existsSync(dir)) return res.status(404).json({ error: "file_not_found", expectedPath: dir });
  const list = walkPng(dir);
  // Group by parent folder
  const groups = {};
  for (const f of list) (groups[f.group] ||= []).push(f);
  res.json({ data: { items: list, groups }, meta: { count: list.length, root: dir } });
});

export default r;
