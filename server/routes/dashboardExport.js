import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
import { DATA_ROOT, existsSafe } from "../utils/paths.js";

const r = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BRAIN_MAP_ROOT = path.resolve(
  process.env.BRAIN_MAP_ROOT || path.join(__dirname, "../../ho31_testsplit_brain_maps")
);
const ROOT_MANIFEST = path.join(BRAIN_MAP_ROOT, "manifest.json");
const SURFACE_FILE = "mean_corr_surface.png";
const ROI_CSV_FILE = "mean_corr_per_roi_best_layer.csv";
const PROTOCOL_C_FILE = "protocol_c_core_roi_scores.csv";
const SUBJECT_SUFFIXES = ["single_female", "single_male", "mixed_female", "mixed_male"];
const MODE_KEY = "prediction";
const METRIC_KEY = "corr";

function subjectPath(modelLabel, subjectId, ...parts) {
  return path.join(BRAIN_MAP_ROOT, modelLabel, "subjects", subjectId, ...parts);
}

function toStaticUrl(...parts) {
  return `/static/brain-maps/${parts.map(part => encodeURIComponent(part)).join("/")}`;
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text);
}

async function readCsv(filePath) {
  const text = await fs.readFile(filePath, "utf8");
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

function simplifyModelLabel(modelLabel) {
  const suffix = SUBJECT_SUFFIXES.find(value => modelLabel.endsWith(`_${value}`));
  return suffix ? modelLabel.slice(0, -(suffix.length + 1)) : modelLabel;
}

function inferAlpha(modelLabel) {
  const match = modelLabel.match(/alpha[_-]?(\d+)/i);
  return match ? match[1] : null;
}

function inferCondition(modelLabel) {
  return SUBJECT_SUFFIXES.find(value => modelLabel.endsWith(`_${value}`)) ?? null;
}

function asNumber(value) {
  return Number.isFinite(value) ? value : Number(value);
}

function summarizeScores(rows) {
  const ranked = rows
    .map(row => ({ ...row, corr: asNumber(row.corr) }))
    .filter(row => Number.isFinite(row.corr))
    .sort((left, right) => right.corr - left.corr);

  const total = ranked.reduce((sum, row) => sum + row.corr, 0);
  const meanCorr = ranked.length ? total / ranked.length : null;

  return {
    meanCorr,
    best: ranked[0] || null,
    worst: ranked[ranked.length - 1] || null,
  };
}

function protocolScorePathCandidates(modelLabel, modelSlug) {
  const condition = inferCondition(modelLabel);
  const alpha = inferAlpha(modelLabel);
  const candidates = [];

  if (condition && /qwen/i.test(modelLabel)) {
    candidates.push(path.join(DATA_ROOT, "qwen_31_finetune", "fit_results", "qwen3_4b_roi31", condition, modelSlug, PROTOCOL_C_FILE));
  }

  if (condition && /llama/i.test(modelLabel)) {
    candidates.push(path.join(DATA_ROOT, "swati_llama_finetune", "fit_results", "llama_production_roi31", condition, modelSlug, PROTOCOL_C_FILE));
  }

  if (alpha) {
    candidates.push(path.join(DATA_ROOT, "ds005345-a1-results", "ho31_alpha_sweep", `alpha_${alpha}`, "qwen3_4b", PROTOCOL_C_FILE));
  }

  if (/base_ho31/i.test(modelLabel)) {
    candidates.push(path.join(DATA_ROOT, "regions_output", "ho31_rois", "qwen3_4b", "fit_results", "Qwen_Qwen3-4B", PROTOCOL_C_FILE));
  }

  return [...new Set(candidates)];
}

async function loadProtocolPeak(modelLabel, modelSlug, subjectId) {
  const protocolPath = protocolScorePathCandidates(modelLabel, modelSlug).find(existsSafe);
  if (!protocolPath) return null;

  const { rows } = await readCsv(protocolPath);
  const ranked = rows
    .filter(row => row.subject === subjectId)
    .map(row => ({
      ...row,
      mean_corr: asNumber(row.mean_corr),
      layer_idx: asNumber(row.layer_idx),
      run: asNumber(row.run),
    }))
    .filter(row => Number.isFinite(row.mean_corr))
    .sort((left, right) => right.mean_corr - left.mean_corr);

  return ranked[0] || null;
}

function subjectKeys(entry) {
  return Object.keys(entry.subjects || {}).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

function buildSelectors(entries, selectedModel, selectedSubject) {
  const availableSubjects = selectedModel ? subjectKeys(selectedModel) : [];

  return {
    models: entries.map(entry => entry.modelLabel),
    availableSubjects,
    selectedModel: selectedModel?.modelLabel ?? null,
    selectedModelAlias: selectedModel?.model ?? null,
    selectedSubject,
    combinations: entries.map(entry => ({
      modelLabel: entry.modelLabel,
      model: entry.model,
      subjects: subjectKeys(entry),
    })),
  };
}

function pickSelection(entries, requestedModel, requestedSubject) {
  const modelEntry = requestedModel
    ? entries.find(entry => entry.modelLabel === requestedModel)
      || entries.find(entry => entry.model === requestedModel)
      || entries[0]
    : entries[0];

  if (!modelEntry) return null;

  const subjects = subjectKeys(modelEntry);
  const subjectId = requestedSubject && modelEntry.subjects?.[requestedSubject]
    ? requestedSubject
    : subjects[0];

  if (!subjectId) return null;

  return {
    modelEntry,
    subjectId,
    subjectConfig: modelEntry.subjects[subjectId],
  };
}

r.get("/dashboard-export", async (req, res) => {
  try {
    const manifest = await readJson(ROOT_MANIFEST);
    const entries = Object.entries(manifest.models ?? {})
      .map(([modelLabel, config]) => ({
        ...config,
        modelLabel,
        model: simplifyModelLabel(modelLabel),
        subjects: config.subjects || {},
      }))
      .sort((left, right) => left.modelLabel.localeCompare(right.modelLabel));

    const selected = pickSelection(entries, req.query.model, req.query.subject);
    if (!selected) {
      return res.status(404).json({
        error: "dashboard_export_missing",
        message: `No brain-map model entries found under ${BRAIN_MAP_ROOT}`,
      });
    }

    const { modelEntry, subjectId, subjectConfig } = selected;
    const roiScoresCsv = await readCsv(subjectPath(modelEntry.modelLabel, subjectId, ROI_CSV_FILE));
    const roiScores = roiScoresCsv.rows.map(row => ({
      ...row,
      corr: asNumber(row.metric_value),
    }));
    const { meanCorr, best, worst } = summarizeScores(roiScores);
    const protocolPeak = await loadProtocolPeak(modelEntry.modelLabel, modelEntry.model_slug, subjectId);
    const colorRange = {
      vmin: subjectConfig.global_vmin,
      vmax: subjectConfig.global_vmax,
      cmap: "viridis",
    };
    const selectors = buildSelectors(entries, modelEntry, subjectId);
    const summary = {
      subject: subjectId,
      model: modelEntry.modelLabel,
      model_alias: modelEntry.model,
      model_slug: modelEntry.model_slug,
      dataset: "HO31 test split",
      protocol: manifest.metric || "mean_corr",
      layer: modelEntry.best_layer,
      mean_corr: meanCorr,
      max_corr: protocolPeak?.mean_corr ?? best?.corr ?? null,
      max_corr_layer: protocolPeak?.layer_idx ?? null,
      max_corr_roi: protocolPeak?.roi_name ?? best?.roi_name ?? null,
      max_corr_run: protocolPeak?.run ?? null,
      max_corr_source: protocolPeak ? PROTOCOL_C_FILE : ROI_CSV_FILE,
      best_roi: best?.roi_name ?? null,
      worst_roi: worst?.roi_name ?? null,
      n_rois: roiScores.length,
      n_subjects: subjectKeys(modelEntry).length,
      n_rows_test_split: subjectConfig.n_rows_test_split ?? modelEntry.n_rows_test_split ?? null,
      n_rois_painted: subjectConfig.n_rois_painted ?? null,
      fit_summary_excerpt: {
        alpha: inferAlpha(modelEntry.modelLabel),
      },
      color_ranges: {
        [MODE_KEY]: colorRange,
      },
    };
    const runConfig = {
      model_label: modelEntry.modelLabel,
      model_alias: modelEntry.model,
      model_slug: modelEntry.model_slug,
      subject: subjectId,
      best_layer: modelEntry.best_layer,
      dataset: "HO31 test split",
      metric: manifest.metric || "mean_corr",
      n_rows_test_split: subjectConfig.n_rows_test_split ?? modelEntry.n_rows_test_split ?? null,
      n_rois_painted: subjectConfig.n_rois_painted ?? null,
      global_vmin: subjectConfig.global_vmin,
      global_vmax: subjectConfig.global_vmax,
    };
    const responseManifest = {
      views: ["surface"],
      modes: {
        [MODE_KEY]: {
          surface: toStaticUrl(modelEntry.modelLabel, "subjects", subjectId, SURFACE_FILE),
        },
      },
      color_ranges: {
        [MODE_KEY]: colorRange,
      },
      note: `Mean correlation surface for ${modelEntry.modelLabel} on ${subjectId}.`,
    };

    res.json({
      data: {
        summary,
        runConfig,
        manifest: responseManifest,
        roiScores,
        roiLookup: roiScores.map(row => ({
          roi_name: row.roi_name,
          kind: "anatomical_language_roi",
        })),
        metricFields: [METRIC_KEY],
        selectors,
      },
      meta: {
        roiCount: roiScores.length,
        modelCount: entries.length,
        subjectCount: subjectKeys(modelEntry).length,
        root: BRAIN_MAP_ROOT,
      },
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        error: "dashboard_export_missing",
        message: `Brain-map files not found under ${BRAIN_MAP_ROOT}`,
      });
    }

    return res.status(500).json({
      error: "dashboard_export_failed",
      message: error.message,
    });
  }
});

export default r;