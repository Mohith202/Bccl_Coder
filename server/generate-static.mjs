/**
 * generate-static.mjs
 *
 * Pre-generates all static JSON data files consumed by the client when deployed
 * without a backend (e.g. Vercel / GitHub Pages).
 *
 * Run from the TEAM-9/server directory:
 *   node generate-static.mjs
 *
 * Output goes to: ../client/public/data/
 * Brain map images are copied to: ../client/public/brain-maps/
 */

import "dotenv/config";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

// ── paths ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Where to write output
const OUT_DIR = path.join(ROOT, "client", "public", "data");
const BRAIN_MAP_IMAGE_OUT = path.join(ROOT, "client", "public", "brain-maps");

// Source directories
const DATA_ROOT = process.env.DATA_ROOT
  ? path.resolve(process.env.DATA_ROOT)
  : path.resolve(ROOT, "../../hf");

const BRAIN_MAP_ROOT = path.resolve(
  process.env.BRAIN_MAP_ROOT || path.join(ROOT, "ho31_testsplit_brain_maps")
);

console.log("DATA_ROOT     :", DATA_ROOT);
console.log("BRAIN_MAP_ROOT:", BRAIN_MAP_ROOT);
console.log("OUT_DIR       :", OUT_DIR);

// ── experiment config (mirrored from server/config.js) ─────────────────────

const EXPERIMENTS = {
  llama_finetune: {
    label: "Llama-3.2-3B Fine-tune",
    folder: "swati_llama_finetune",
    model_family: "Llama",
    kind: "finetune",
    has_categories: true,
  },
  qwen_regional: {
    label: "Qwen3-4B Regional Analysis",
    folder: "regions_output/a1_features_qwen3_4b",
    model_family: "Qwen",
    kind: "regional",
    has_categories: true,
  },
  qwen_roi31: {
    label: "Qwen3-4B ROI-31 Set",
    folder: "qwen_31_finetune",
    model_family: "Qwen",
    kind: "roi_set",
    has_categories: true,
  },
  alpha_sweep: {
    label: "Alpha Hyperparameter Sweep (HO-31)",
    folder: "ds005345-a1-results/ho31_alpha_sweep",
    model_family: "Qwen",
    kind: "alpha_sweep",
    has_categories: false,
  },
  bootstrap_membership: {
    label: "Bootstrap ROI Membership (7-ROI)",
    folder: "7ROI_outputs",
    model_family: "Mixed",
    kind: "membership",
    has_categories: true,
  },
};

const AVAILABLE_METRICS = ["mean_corr", "r2", "pearson_r"];
const DEFAULT_METRIC = "mean_corr";

// ── helpers ─────────────────────────────────────────────────────────────────

function existsSafe(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function readJsonSync(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function parseCsv(text) {
  const r = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
  return r.data;
}

function readCsvSync(p) {
  try { return parseCsv(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function findFilesRecursive(dir, filename, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) findFilesRecursive(abs, filename, out);
    else if (e.isFile() && e.name === filename) out.push(abs);
  }
  return out;
}

const CAT_RE = /single_male|single_female|mixed_male|mixed_female/i;
function inferCategory(absPath) {
  const parts = absPath.replace(/\\/g, "/").split("/");
  for (let i = parts.length - 2; i >= 0; i--) {
    if (CAT_RE.test(parts[i])) return parts[i].toLowerCase();
  }
  return null;
}

function loadAllCsvMerged(expKey, filename) {
  const dir = path.join(DATA_ROOT, EXPERIMENTS[expKey]?.folder ?? "");
  if (!existsSafe(dir)) return [];
  const files = findFilesRecursive(dir, filename);
  const allRows = [];
  for (const abs of files) {
    const rows = readCsvSync(abs);
    if (!rows) continue;
    const cat = inferCategory(abs);
    for (const row of rows) {
      allRows.push(cat ? { ...row, _category: cat } : row);
    }
  }
  return allRows;
}

function findCsv(expKey, candidates) {
  const dir = path.join(DATA_ROOT, EXPERIMENTS[expKey]?.folder ?? "");
  for (const rel of candidates) {
    const abs = path.join(dir, rel);
    if (existsSafe(abs)) return abs;
  }
  return null;
}

function loadCsvWithFallback(expKey, candidates) {
  const direct = findCsv(expKey, candidates);
  if (direct) {
    const rows = readCsvSync(direct);
    if (rows) return rows;
  }
  // Recursive fallback
  const fname = path.basename(candidates[0]);
  return loadAllCsvMerged(expKey, fname);
}

async function mkdirp(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function writeJson(filePath, data) {
  await mkdirp(path.dirname(filePath));
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log("  wrote", path.relative(ROOT, filePath));
}

async function copyFile(src, dest) {
  await mkdirp(path.dirname(dest));
  await fsp.copyFile(src, dest);
}

// ── 1. experiments.json ─────────────────────────────────────────────────────

async function generateExperiments() {
  const data = Object.entries(EXPERIMENTS).map(([key, cfg]) => ({
    key,
    ...cfg,
    exists: existsSafe(path.join(DATA_ROOT, cfg.folder)),
    path: path.join(DATA_ROOT, cfg.folder),
  }));

  await writeJson(path.join(OUT_DIR, "experiments.json"), {
    data,
    meta: { metrics: AVAILABLE_METRICS, defaultMetric: DEFAULT_METRIC },
  });
}

// ── 2. per-experiment CSVs ──────────────────────────────────────────────────

async function generateExperimentData() {
  for (const [key] of Object.entries(EXPERIMENTS)) {
    const outDir = path.join(OUT_DIR, key);

    // layer-summary
    const layerRows = loadCsvWithFallback(key, [
      "fit_results/core_roi_layer_summary.csv",
      "core_roi_layer_summary.csv",
    ]);
    await writeJson(path.join(outDir, "layer-summary.json"), {
      data: layerRows,
      meta: { rows: layerRows.length },
    });

    // best-layer
    const bestRows = loadCsvWithFallback(key, [
      "fit_results/core_roi_best_layer_summary.csv",
      "core_roi_best_layer_summary.csv",
    ]);
    await writeJson(path.join(outDir, "best-layer.json"), {
      data: bestRows,
      meta: { rows: bestRows.length },
    });

    // best-layer-vs-nc
    const ncRows = loadCsvWithFallback(key, [
      "fit_results/best_layer_vs_noise_ceiling.csv",
      "best_layer_vs_noise_ceiling.csv",
    ]);
    await writeJson(path.join(outDir, "best-layer-vs-nc.json"), {
      data: ncRows,
      meta: { rows: ncRows.length },
    });

    // figures — empty for static build (no PNGs bundled from hf/)
    await writeJson(path.join(outDir, "figures.json"), {
      data: { items: [], groups: {} },
      meta: { count: 0 },
    });
  }
}

// ── 3. brain-map: copy images + generate per-subject export JSON ────────────

function asNumber(v) {
  return Number.isFinite(v) ? v : Number(v);
}

function summarizeScores(rows) {
  const ranked = rows
    .map(r => ({ ...r, corr: asNumber(r.corr ?? r.metric_value) }))
    .filter(r => Number.isFinite(r.corr))
    .sort((a, b) => b.corr - a.corr);
  const total = ranked.reduce((s, r) => s + r.corr, 0);
  return {
    meanCorr: ranked.length ? total / ranked.length : null,
    best: ranked[0] || null,
    worst: ranked[ranked.length - 1] || null,
  };
}

function inferAlpha(modelLabel) {
  const m = modelLabel.match(/alpha[_-]?(\d+)/i);
  return m ? m[1] : null;
}

function inferCondition(modelLabel) {
  const suffixes = ["single_female", "single_male", "mixed_female", "mixed_male"];
  return suffixes.find(s => modelLabel.endsWith(`_${s}`)) ?? null;
}

function subjectKeys(entry) {
  return Object.keys(entry.subjects || {}).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function generateBrainMaps() {
  if (!existsSafe(BRAIN_MAP_ROOT)) {
    console.warn("  BRAIN_MAP_ROOT not found, skipping brain-map generation");
    return;
  }

  const manifest = readJsonSync(path.join(BRAIN_MAP_ROOT, "manifest.json"));
  if (!manifest) {
    console.warn("  manifest.json not found, skipping brain-map generation");
    return;
  }

  const entries = Object.entries(manifest.models ?? {})
    .map(([modelLabel, cfg]) => ({
      ...cfg,
      modelLabel,
      model: modelLabel.replace(/_(?:single|mixed)_(?:female|male)$/, ""),
      subjects: cfg.subjects || {},
    }))
    .sort((a, b) => a.modelLabel.localeCompare(b.modelLabel));

  // Build selectors manifest consumed by the BrainActivationMap page
  const selectors = {
    models: entries.map(e => e.modelLabel),
    combinations: entries.map(e => ({
      modelLabel: e.modelLabel,
      model: e.model,
      subjects: subjectKeys(e),
    })),
  };
  await writeJson(path.join(OUT_DIR, "brain-map", "selectors.json"), selectors);

  for (const entry of entries) {
    for (const subjectId of subjectKeys(entry)) {
      const subjectCfg = entry.subjects[subjectId];
      const subjectDir = path.join(BRAIN_MAP_ROOT, entry.modelLabel, "subjects", subjectId);

      // Copy PNG
      const srcPng = path.join(subjectDir, "mean_corr_surface.png");
      const destPng = path.join(BRAIN_MAP_IMAGE_OUT, entry.modelLabel, subjectId, "mean_corr_surface.png");
      if (existsSafe(srcPng)) {
        await copyFile(srcPng, destPng);
      }

      // Read ROI CSV
      const roiCsvPath = path.join(subjectDir, "mean_corr_per_roi_best_layer.csv");
      const roiRows = existsSafe(roiCsvPath)
        ? (readCsvSync(roiCsvPath) || []).map(r => ({ ...r, corr: asNumber(r.metric_value ?? r.corr) }))
        : [];
      const { meanCorr, best, worst } = summarizeScores(roiRows);

      const colorRange = {
        vmin: subjectCfg.global_vmin,
        vmax: subjectCfg.global_vmax,
        cmap: "viridis",
      };

      // Relative URL for static serving
      const imageUrl = `brain-maps/${entry.modelLabel}/${subjectId}/mean_corr_surface.png`;

      const exportData = {
        summary: {
          subject: subjectId,
          model: entry.modelLabel,
          model_alias: entry.model,
          model_slug: entry.model_slug,
          dataset: "HO31 test split",
          protocol: manifest.metric || "mean_corr",
          layer: entry.best_layer,
          mean_corr: meanCorr,
          max_corr: best?.corr ?? null,
          max_corr_roi: best?.roi_name ?? null,
          best_roi: best?.roi_name ?? null,
          worst_roi: worst?.roi_name ?? null,
          n_rois: roiRows.length,
          n_subjects: subjectKeys(entry).length,
          n_rows_test_split: subjectCfg.n_rows_test_split ?? entry.n_rows_test_split ?? null,
          n_rois_painted: subjectCfg.n_rois_painted ?? null,
          fit_summary_excerpt: { alpha: inferAlpha(entry.modelLabel) },
          color_ranges: { prediction: colorRange },
        },
        runConfig: {
          model_label: entry.modelLabel,
          model_alias: entry.model,
          model_slug: entry.model_slug,
          subject: subjectId,
          best_layer: entry.best_layer,
          dataset: "HO31 test split",
          metric: manifest.metric || "mean_corr",
          n_rows_test_split: subjectCfg.n_rows_test_split ?? entry.n_rows_test_split ?? null,
          n_rois_painted: subjectCfg.n_rois_painted ?? null,
          global_vmin: subjectCfg.global_vmin,
          global_vmax: subjectCfg.global_vmax,
        },
        manifest: {
          views: ["surface"],
          modes: {
            prediction: { surface: imageUrl },
          },
          color_ranges: { prediction: colorRange },
          note: `Mean correlation surface for ${entry.modelLabel} on ${subjectId}.`,
        },
        roiScores: roiRows,
        selectors: {
          ...selectors,
          availableSubjects: subjectKeys(entry),
          selectedModel: entry.modelLabel,
          selectedSubject: subjectId,
        },
      };

      await writeJson(
        path.join(OUT_DIR, "brain-map", entry.modelLabel, `${subjectId}.json`),
        { data: exportData }
      );
    }
  }
}

// ── main ────────────────────────────────────────────────────────────────────

console.log("\n[1/3] Generating experiments + per-experiment data...");
await generateExperiments();
await generateExperimentData();

console.log("\n[2/3] Generating brain-map JSON + copying PNGs...");
await generateBrainMaps();

console.log("\n[3/3] Done. Static data written to client/public/data/");
