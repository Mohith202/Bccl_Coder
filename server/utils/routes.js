// Common helpers for routes.
import path from "node:path";
import fs from "node:fs";
import { experimentDir, statSafe } from "./paths.js";
import { readCsv } from "./csv.js";
import { readJson } from "./json.js";

export function notFound(res, expectedPath, extra = {}) {
  return res.status(404).json({ error: "file_not_found", expectedPath, ...extra });
}

export function ok(res, data, sourceAbs) {
  const st = statSafe(sourceAbs);
  return res.json({
    data,
    meta: {
      rows: Array.isArray(data) ? data.length : undefined,
      source: Array.isArray(sourceAbs) ? sourceAbs : sourceAbs,
      mtime: st ? new Date(st.mtimeMs).toISOString() : null,
    },
  });
}

// Recursively walk dir, collect all files matching filename.
export function findFilesRecursive(dir, filename, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) findFilesRecursive(abs, filename, out);
    else if (e.isFile() && e.name === filename) out.push(abs);
  }
  return out;
}

// Infer category from the path (nearest ancestor dir that looks like a category name).
const CAT_RE = /single_male|single_female|mixed_male|mixed_female|single_m\b|single_f\b|mixed_m\b|mixed_f\b/i;
function inferCategory(absPath) {
  const parts = absPath.replace(/\\/g, "/").split("/");
  for (let i = parts.length - 2; i >= 0; i--) {
    if (CAT_RE.test(parts[i])) return parts[i].toLowerCase();
  }
  return null;
}

// Load all CSVs matching filename under the experiment dir, merge rows, tag with category.
export function loadAllCsvMerged(expKey, filename) {
  const dir = experimentDir(expKey);
  if (!dir) return { error: "unknown_experiment" };
  const files = findFilesRecursive(dir, filename);
  if (!files.length) return { error: "not_found", expected: [`${dir}/**/${filename}`] };
  const allRows = [];
  for (const abs of files) {
    const parsed = readCsv(abs);
    if (!parsed) continue;
    const cat = inferCategory(abs);
    for (const row of parsed.rows) {
      allRows.push(cat ? { ...row, _category: cat } : row);
    }
  }
  return { rows: allRows, sources: files };
}

export function findCsv(expKey, candidates) {
  const dir = experimentDir(expKey);
  if (!dir) return { error: "unknown_experiment" };
  for (const rel of candidates) {
    const abs = path.join(dir, rel);
    if (fs.existsSync(abs)) return { abs, rel };
  }
  return { error: "not_found", expected: candidates.map(c => path.join(dir, c)) };
}

export function findJson(expKey, candidates) {
  return findCsv(expKey, candidates);
}

// Try fixed candidates first; fall back to recursive search by filename.
export function loadCsvOr404(res, expKey, candidates, fallbackFilename) {
  const r = findCsv(expKey, candidates);
  if (!r.error) {
    const parsed = readCsv(r.abs);
    if (parsed) return ok(res, parsed.rows, r.abs);
  }
  // Recursive fallback
  const fname = fallbackFilename || path.basename(candidates[0]);
  const merged = loadAllCsvMerged(expKey, fname);
  if (merged.error) return notFound(res, r.expected || candidates, { error: merged.error });
  return res.json({
    data: merged.rows,
    meta: { rows: merged.rows.length, sources: merged.sources },
  });
}

export function loadJsonOr404(res, expKey, candidates) {
  const r = findJson(expKey, candidates);
  if (r.error) {
    // Try recursive JSON search
    const dir = experimentDir(expKey);
    if (dir) {
      const fname = path.basename(candidates[0]);
      const found = findFilesRecursive(dir, fname);
      if (found.length) {
        const data = readJson(found[0]);
        if (data) return ok(res, data, found[0]);
      }
    }
    return notFound(res, r.expected || candidates, { error: r.error });
  }
  const data = readJson(r.abs);
  if (!data) return notFound(res, r.abs);
  return ok(res, data, r.abs);
}

export { experimentDir };
