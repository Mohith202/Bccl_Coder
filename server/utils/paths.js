import path from "node:path";
import fs from "node:fs";
import { EXPERIMENTS } from "../config.js";

export const DATA_ROOT = path.resolve(process.env.DATA_ROOT || "d:/csai2/hf");

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
