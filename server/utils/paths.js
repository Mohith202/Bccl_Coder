import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { EXPERIMENTS } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDefaultDataRoot() {
  if (process.env.DATA_ROOT) return path.resolve(process.env.DATA_ROOT);

  const candidates = [
    path.resolve(__dirname, "../../../hf"),
    path.resolve("d:/csai2/hf"),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // Ignore invalid or inaccessible candidates and continue.
    }
  }

  return candidates[0];
}

export const DATA_ROOT = resolveDefaultDataRoot();

export function experimentDir(expKey) {
  const cfg = EXPERIMENTS[expKey];
  if (!cfg) return null;
  return path.join(DATA_ROOT, cfg.folder);
}

export function resolveData(...parts) {
  return path.join(DATA_ROOT, ...parts);
}

export function existsSafe(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

export function statSafe(p) {
  try { return fs.statSync(p); } catch { return null; }
}
