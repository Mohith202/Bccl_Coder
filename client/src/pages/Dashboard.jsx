import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import MetricCard from "../components/MetricCard.jsx";
import ChartPanel from "../components/ChartPanel.jsx";
import { Card } from "../components/Card.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";

function meanOf(rows, key) {
  const vals = (rows || []).map(r => r[key]).filter(v => typeof v === "number" && !isNaN(v));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function roiOf(row) {
  return row?.roi || row?.roi_name || row?.region || null;
}

function layerOf(row) {
  return row?.layer ?? row?.layer_idx ?? null;
}

export default function Dashboard({ exp, expLabel, metric }) {
  const layer = useQuery({ queryKey: ["layerSummary", exp], queryFn: () => api.layerSummary(exp), retry: false });
  const best = useQuery({ queryKey: ["bestLayer", exp], queryFn: () => api.bestLayer(exp), retry: false });

  const rows = layer.data?.data || [];
  const bestRows = best.data?.data || [];
  const meanMetric = meanOf(rows, metric);
  const nRois = new Set(rows.map(roiOf).filter(Boolean)).size;
  const nLayers = new Set(rows.map(layerOf).filter(v => v != null)).size;
  const rankedRows = rows
    .filter(r => typeof r[metric] === "number")
    .slice()
    .sort((left, right) => right[metric] - left[metric]);
  const peakRow = rankedRows[0] || null;
  const topBestRows = bestRows
    .filter(r => typeof r[metric] === "number")
    .slice()
    .sort((left, right) => right[metric] - left[metric])
    .slice(0, 5);

  // Build a compact layer comparison for the strongest ROIs only.
  const byRoi = {};
  for (const r of rows) {
    const roi = roiOf(r);
    const layerIdx = layerOf(r);
    if (!roi || layerIdx == null || typeof r[metric] !== "number") continue;
    (byRoi[roi] ||= []).push({ x: layerIdx, y: r[metric] });
  }
  const traces = Object.entries(byRoi)
    .map(([roi, pts]) => ({
      roi,
      peak: Math.max(...pts.map(point => point.y)),
      pts,
    }))
    .sort((left, right) => right.peak - left.peak)
    .slice(0, 6)
    .map(({ roi, pts }) => {
    const sorted = pts.slice().sort((a, b) => a.x - b.x);
    return {
      type: "scatter", mode: "lines+markers", name: roi,
      x: sorted.map(p => p.x), y: sorted.map(p => p.y),
      hovertemplate: `<b>${roi}</b><br>layer=%{x}<br>${metric}=%{y:.4f}<extra></extra>`,
    };
  });

  return (
    <>
      <PageHeader
        title="Overview"
        experiment={expLabel}
        description="A cleaner entry point into the experiment: headline metrics, strongest ROI trends, and a direct path into the interactive explorer."
      />

      <section className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <Card className="overflow-hidden p-6 lg:p-7">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-400">Research dashboard</div>
          <h2 className="mt-3 serif text-3xl font-semibold leading-tight text-ink-900 lg:text-4xl">
            A narrative overview instead of a raw result dump.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-600">
            Start here for the strongest experiment-level signals, then jump into the per-subject brain explorer when you need a more focused story.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/brain-map" className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100">
              Open interactive explorer
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Current experiment</div>
          <div className="mt-2 text-xl font-semibold text-ink-900">{expLabel}</div>
          <div className="mt-5 space-y-4 text-sm text-ink-600">
            <div className="flex items-start justify-between gap-4 border-t border-ink-100 pt-4 first:border-t-0 first:pt-0">
              <span>Primary metric</span>
              <span className="font-medium text-ink-900">{metric}</span>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-ink-100 pt-4">
              <span>Peak ROI</span>
              <span className="font-medium text-ink-900">{peakRow ? roiOf(peakRow) : "—"}</span>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-ink-100 pt-4">
              <span>Peak layer</span>
              <span className="font-medium text-ink-900">{peakRow ? layerOf(peakRow) : "—"}</span>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-ink-100 pt-4">
              <span>Available ROI traces</span>
              <span className="font-medium text-ink-900">{traces.length}</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <MetricCard label="Mean metric" value={meanMetric != null ? meanMetric.toFixed(4) : "—"} unit={metric.includes("corr") ? "r" : ""} help={`Mean of ${metric} across rows`} />
        <MetricCard label="Peak metric" value={peakRow ? peakRow[metric].toFixed(4) : "—"} unit={metric.includes("corr") ? "r" : ""} help={`Maximum ${metric} found in the layer summary`} />
        <MetricCard label="ROIs" value={nRois || "—"} unit="ROI" help="Distinct ROI count" />
        <MetricCard label="Layers" value={nLayers || "—"} unit="layers" help="Distinct layer indices" />
      </section>

      {layer.isLoading && <Skeleton className="h-96" />}
      <ErrorPanel error={layer.error} />

      {traces.length > 0 && (
        <ChartPanel
          title="Layer profiles for the strongest ROIs"
          subtitle={`Top 6 ROI traces ranked by peak ${metric}`}
          data={traces}
          layout={{ xaxis: { title: "Layer" }, yaxis: { title: metric } }}
          height={420}
        />
      )}

      {rows.length === 0 && !layer.isLoading && !layer.error && (
        <EmptyHint message="No layer summary rows available." />
      )}

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Top ROI headlines</div>
          <div className="mt-2 text-xl font-semibold text-ink-900">Best layer results worth following up</div>
          <div className="mt-5 space-y-4">
            {topBestRows.map((row, index) => (
              <div key={`${roiOf(row)}-${index}`} className="flex items-center justify-between gap-4 border-t border-ink-100 pt-4 first:border-t-0 first:pt-0">
                <div>
                  <div className="font-medium text-ink-900">{roiOf(row) || "Unknown ROI"}</div>
                  <div className="text-sm text-ink-500">Layer {layerOf(row) ?? "—"}</div>
                </div>
                <div className="mono tabular-nums text-sm text-ink-600">{typeof row[metric] === "number" ? row[metric].toFixed(4) : "—"}</div>
              </div>
            ))}
            {topBestRows.length === 0 && <div className="text-sm text-ink-500">No best-layer rows available for this experiment.</div>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Next steps</div>
          <div className="mt-2 text-xl font-semibold text-ink-900">Continue into the interactive explorer</div>
          <div className="mt-5 space-y-3 text-sm">
            <Link to="/brain-map" className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 font-medium text-ink-800 transition hover:border-indigo-300 hover:text-indigo-700">
              Interactive explorer for per-subject maps
            </Link>
          </div>
        </Card>
      </section>
    </>
  );
}
