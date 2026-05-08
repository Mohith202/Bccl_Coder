// All data is served from pre-generated static JSON files in public/data/.
// No backend server is required.

async function getJSON(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

// Resolves a static data file path relative to the app root.
export function staticDataUrl(relPath) {
  return `data/${relPath}`;
}

export const api = {
  experiments: () => getJSON(staticDataUrl("experiments.json")),
  layerSummary: (exp) => getJSON(staticDataUrl(`${exp}/layer-summary.json`)),
  bestLayer: (exp) => getJSON(staticDataUrl(`${exp}/best-layer.json`)),
  bestLayerVsNc: (exp) => getJSON(staticDataUrl(`${exp}/best-layer-vs-nc.json`)),
  figures: (exp) => getJSON(staticDataUrl(`${exp}/figures.json`)),
  // Brain map: fetches pre-generated per-subject export JSON
  dashboardExport: (model, subject) =>
    getJSON(staticDataUrl(`brain-map/${encodeURIComponent(model)}/${encodeURIComponent(subject)}.json`)),
  brainMapSelectors: () => getJSON(staticDataUrl("brain-map/selectors.json")),
};

// Asset URL helpers (kept for compatibility with BrainActivationMap + PresentationPage)
export function resolveApiUrl(path) { return path; }
export function resolveAppAssetUrl(path) {
  if (!path) return path;
  return path.startsWith("/") ? path.slice(1) : path;
}
