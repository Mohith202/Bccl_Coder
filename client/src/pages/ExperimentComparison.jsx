import { useQueries } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import ChartPanel from "../components/ChartPanel.jsx";
import DataGridPanel from "../components/DataGridPanel.jsx";
import { ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";

export default function ExperimentComparison({ metric, experiments = [] }) {
  const queries = useQueries({
    queries: experiments.map(e => ({
      queryKey: ["bestLayer", e.key],
      queryFn: () => api.bestLayer(e.key).catch(() => ({ data: [] })),
      retry: false,
    })),
  });

  const merged = [];
  experiments.forEach((e, i) => {
    const rows = queries[i]?.data?.data || [];
    rows.forEach(r => merged.push({ experiment: e.label, ...r }));
  });

  // Bar: mean metric per experiment
  const groups = {};
  for (const r of merged) {
    if (typeof r[metric] !== "number") continue;
    (groups[r.experiment] ||= []).push(r[metric]);
  }
  const labels = Object.keys(groups);
  const means = labels.map(l => groups[l].reduce((a, b) => a + b, 0) / groups[l].length);

  return (
    <>
      <PageHeader
        title="Experiment Comparison"
        description="Compare best-layer performance across all registered experiments."
      />
      {queries.some(q => q.error) && <ErrorPanel error={queries.find(q => q.error)?.error} />}

      {labels.length > 0 ? (
        <ChartPanel
          title={`Mean ${metric} by experiment`}
          data={[{
            type: "bar", x: labels, y: means,
            hovertemplate: `<b>%{x}</b><br>mean ${metric}=%{y:.4f}<extra></extra>`,
          }]}
          layout={{ yaxis: { title: metric }, xaxis: { tickangle: -15 } }}
        />
      ) : (
        <EmptyHint message="No best-layer data available across experiments." />
      )}

      <div className="mt-6">
        <DataGridPanel title="Best-layer rows (all experiments)" rows={merged} height={420} />
      </div>
    </>
  );
}
