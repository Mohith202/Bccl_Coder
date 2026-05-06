import fs from "node:fs";
import { getCached } from "../cache.js";
import { statSafe } from "./paths.js";

export function readJson(absPath) {
  const st = statSafe(absPath);
  if (!st) return null;
  return getCached(absPath, st.mtimeMs, () => {
    const text = fs.readFileSync(absPath, "utf8");
    try { return JSON.parse(text); } catch (e) { return { __error: e.message }; }
  });
}
