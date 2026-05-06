// Simple mtime-keyed cache for parsed files.
const store = new Map();

export function getCached(absPath, mtimeMs, loader) {
  const key = absPath;
  const hit = store.get(key);
  if (hit && hit.mtimeMs === mtimeMs) return hit.value;
  const value = loader();
  store.set(key, { mtimeMs, value });
  return value;
}
