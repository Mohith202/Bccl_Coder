import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import { DATA_ROOT } from "../utils/paths.js";

const r = Router();
const EXPORT_DIR = path.join(DATA_ROOT, "dashboard_export");

function exportPath(...parts) {
  return path.join(EXPORT_DIR, ...parts);
}

function toStaticUrl(relativePath) {
  return `/static/figures/dashboard_export/${relativePath.replace(/\\/g, "/")}`;
}

async function readJson(relativePath) {
  const text = await fs.readFile(exportPath(relativePath), "utf8");
  return JSON.parse(text);
}

async function readCsv(relativePath) {
  const text = await fs.readFile(exportPath(relativePath), "utf8");
  const parsed = Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return {
    rows: parsed.data,
    fields: parsed.meta.fields ?? [],
  };
}

r.get("/dashboard-export", async (_req, res) => {
  try {
    const [manifest, summary, roiScoresCsv, roiLookupCsv] = await Promise.all([
      readJson("brain_maps_manifest.json"),
      readJson("metrics_summary.json"),
      readCsv("roi_scores.csv"),
      readCsv("roi_lookup.csv"),
    ]);

    const modes = Object.fromEntries(
      Object.entries(manifest.modes ?? {}).map(([mode, views]) => [
        mode,
        Object.fromEntries(
          Object.entries(views).map(([view, relativePath]) => [view, toStaticUrl(relativePath)])
        ),
      ])
    );

    const metricFields = [
      "pred_mean",
      "truth_mean",
      "error",
      "abs_error",
      "corr",
      "r2",
      "2v2_accuracy",
    ].filter(field => roiScoresCsv.fields.includes(field));

    res.json({
      data: {
        summary,
        manifest: {
          ...manifest,
          modes,
        },
        roiScores: roiScoresCsv.rows,
        roiLookup: roiLookupCsv.rows,
        metricFields,
      },
      meta: {
        roiCount: roiScoresCsv.rows.length,
        lookupCount: roiLookupCsv.rows.length,
      },
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        error: "dashboard_export_missing",
        message: `dashboard_export files not found under ${EXPORT_DIR}`,
      });
    }

    return res.status(500).json({
      error: "dashboard_export_failed",
      message: error.message,
    });
  }
});

export default r;