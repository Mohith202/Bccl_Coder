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

export const api = {
  experiments: () => getJSON("/api/experiments"),
  coreRoi: (exp) => getJSON(`/api/${exp}/core-roi`),
  layerSummary: (exp) => getJSON(`/api/${exp}/core-roi/layer-summary`),
  bestLayer: (exp) => getJSON(`/api/${exp}/core-roi/best-layer`),
  bestLayerVsNc: (exp) => getJSON(`/api/${exp}/best-layer-vs-nc`),
  noiseCeiling: (exp) => getJSON(`/api/${exp}/noise-ceiling`),
  protocolC: (exp) => getJSON(`/api/${exp}/protocol-c`),
  anatomy: (exp, k) => getJSON(`/api/${exp}/anatomy/${k}`),
  jaccard: (exp) => getJSON(`/api/${exp}/jaccard`),
  iscSummary: (exp) => getJSON(`/api/${exp}/isc-summary`),
  iscVoxel: (exp) => getJSON(`/api/${exp}/isc-voxel-mapping`),
  topVoxels: (exp) => getJSON(`/api/${exp}/top-voxels-summary`),
  bootstrapMembership: (exp) => getJSON(`/api/${exp}/bootstrap/membership`),
  bootstrapSummary: (exp) => getJSON(`/api/${exp}/bootstrap/summary`),
  qc: (exp) => getJSON(`/api/${exp}/qc`),
  alphaSweep: () => getJSON("/api/alpha-sweep"),
  figures: (exp) => getJSON(`/api/${exp}/figures`),
};
