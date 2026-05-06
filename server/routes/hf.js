import { Router } from "express";
import Papa from "papaparse";

const r = Router();

const REPO = "Mohith202/ds005345-a1-results";
const RAW_BASE = `https://huggingface.co/datasets/${REPO}/resolve/main`;
const API_BASE  = `https://huggingface.co/api/datasets/${REPO}`;

// ── known job registry ──────────────────────────────────────────────────────
export const HF_JOBS = {
  qwen3_4b_finetune: {
    label: "Qwen3-4B Fine-tune (single_female)",
    job: "qwen3_4b_finetune",
    category: "single_female",
    bootstrap: "a1_bootstrap_hf",
    runDir: "workspace_workspace_repo_outputs_finetuned_single_female_20260503_081243_single_female_Qwen_Qwen3-4B_merged",
  },
};

function fitBase(cfg) {
  return `hf_jobs/${cfg.job}/${cfg.category}/${cfg.bootstrap}/${cfg.category}/fit_results/${cfg.runDir}`;
}

// ── helpers ─────────────────────────────────────────────────────────────────
async function hfFetch(url) {
  const res = await fetch(url, { headers: { "User-Agent": "node-dashboard/1.0" } });
  if (!res.ok) throw Object.assign(new Error(`HF ${res.status}: ${url}`), { status: res.status });
  return res;
}

// ── routes ───────────────────────────────────────────────────────────────────

// GET /api/hf/jobs  — list all registered HF jobs + their plot URLs
r.get("/hf/jobs", async (_req, res) => {
  const jobs = [];
  for (const [key, cfg] of Object.entries(HF_JOBS)) {
    const base = fitBase(cfg);
    const plotsApiUrl = `${API_BASE}/tree/main/${base}/plots`;
    let plots = [];
    try {
      const resp = await hfFetch(plotsApiUrl);
      const files = await resp.json();
      plots = files
        .filter(f => f.type === "file" && /\.png$/i.test(f.path))
        .map(f => ({
          name: f.path.split("/").pop(),
          label: f.path.split("/").pop()
            .replace(/\.png$/i, "")
            .replace(/_/g, " "),
          url: `${RAW_BASE}/${f.path}`,
        }));
    } catch {}

    const csvFiles = [
      "core_roi_best_layer_summary.csv",
      "core_roi_layer_summary.csv",
      "core_roi_scores_all.csv",
      "protocol_c_core_roi_scores.csv",
    ].map(name => ({
      name,
      label: name.replace(/\.csv$/, "").replace(/_/g, " "),
      apiPath: `/api/hf/csv?job=${key}&file=${name}`,
    }));

    jobs.push({ key, ...cfg, fitBase: base, plots, csvFiles });
  }
  res.json({ data: jobs });
});

// GET /api/hf/csv?job=qwen3_4b_finetune&file=core_roi_best_layer_summary.csv
r.get("/hf/csv", async (req, res) => {
  const { job, file } = req.query;
  if (!job || !file) return res.status(400).json({ error: "job and file required" });
  const cfg = HF_JOBS[job];
  if (!cfg) return res.status(404).json({ error: "unknown job" });
  if (!/^[\w._-]+\.csv$/.test(file))
    return res.status(400).json({ error: "invalid filename" });

  const url = `${RAW_BASE}/${fitBase(cfg)}/${file}`;
  try {
    const resp = await hfFetch(url);
    const text = await resp.text();
    const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
    res.json({ data: parsed.data, meta: { rows: parsed.data.length, source: url, fields: parsed.meta.fields } });
  } catch (e) {
    res.status(e.status || 502).json({ error: e.message });
  }
});

// GET /api/hf/plot-proxy?url=https://...  — stream a PNG to avoid CORS
r.get("/hf/plot-proxy", async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith("https://huggingface.co/"))
    return res.status(400).json({ error: "invalid url" });
  try {
    const resp = await hfFetch(url);
    res.set("Content-Type", resp.headers.get("content-type") || "image/png");
    res.set("Cache-Control", "public, max-age=3600");
    const buf = Buffer.from(await resp.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.status(e.status || 502).json({ error: e.message });
  }
});

export default r;
