import fs from "node:fs";
import Papa from "papaparse";
import { getCached } from "../cache.js";
import { statSafe } from "./paths.js";

export function readCsv(absPath) {
  const st = statSafe(absPath);
  if (!st) return null;
  return getCached(absPath, st.mtimeMs, () => {
    const text = fs.readFileSync(absPath, "utf8");
    const parsed = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    return { rows: parsed.data, errors: parsed.errors, fields: parsed.meta.fields };
  });
}
