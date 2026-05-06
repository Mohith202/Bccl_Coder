import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import MetricCard from "../components/MetricCard.jsx";
import ChartPanel from "../components/ChartPanel.jsx";
import AccordionSection from "../components/AccordionSection.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";

function meanOf(rows, key) {
  const vals = (rows || []).map(r => r[key]).filter(v => typeof v === "number" && !isNaN(v));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default function Dashboard({ exp, expLabel, metric }) {
  const layer = useQuery({ queryKey: ["layerSummary", exp], queryFn: () => api.layerSummary(exp), retry: false });
  const best = useQuery({ queryKey: ["bestLayer", exp], queryFn: () => api.bestLayer(exp), retry: false });

  const rows = layer.data?.data || [];
  const meanMetric = meanOf(rows, metric);
  const nRois = new Set(rows.map(r => r.roi).filter(Boolean)).size;
  const nLayers = new Set(rows.map(r => r.layer).filter(v => v != null)).size;

  // Build a per-ROI mean line (over layers) using selected metric
  const byRoi = {};
  for (const r of rows) {
    if (!r.roi || typeof r[metric] !== "number") continue;
    (byRoi[r.roi] ||= []).push({ x: r.layer, y: r[metric] });
  }
  const traces = Object.entries(byRoi).slice(0, 12).map(([roi, pts]) => {
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
        title="Dashboard"
        experiment={expLabel}
        description="Snapshot of the selected experiment: headline metrics and per-ROI layer trajectories."
      />

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <MetricCard label="Mean metric" value={meanMetric != null ? meanMetric.toFixed(4) : "—"} unit={metric.includes("corr") ? "r" : ""} help={`Mean of ${metric} across rows`} />
        <MetricCard label="ROIs" value={nRois || "—"} unit="ROI" help="Distinct ROI count" />
        <MetricCard label="Layers" value={nLayers || "—"} unit="layers" help="Distinct layer indices" />
        <MetricCard label="Rows" value={rows.length || "—"} unit="rows" help="Source CSV rows" />
      </section>

      {layer.isLoading && <Skeleton className="h-96" />}
      <ErrorPanel error={layer.error} />

      {traces.length > 0 && (
        <ChartPanel
          title="Per-ROI layer curves"
          subtitle={`Metric: ${metric}`}
          data={traces}
          layout={{ xaxis: { title: "Layer" }, yaxis: { title: metric } }}
          height={420}
        />
      )}

      {rows.length === 0 && !layer.isLoading && !layer.error && (
        <EmptyHint message="No layer summary rows available." />
      )}

      <div className="mt-6 space-y-3">
        <AccordionSection title="Best-layer summary (raw)" count={best.data?.data?.length}>
          <pre className="mono text-xs overflow-auto max-h-80">{JSON.stringify(best.data?.data?.slice(0, 50), null, 2)}</pre>
        </AccordionSection>
      </div>
    </>
  );
}
