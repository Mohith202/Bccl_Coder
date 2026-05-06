import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import ChartPanel from "../components/ChartPanel.jsx";
import DataGridPanel from "../components/DataGridPanel.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";

export default function HyperparameterSweep() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["alphaSweep"], queryFn: api.alphaSweep, retry: false,
  });
  const items = data?.data || [];

  // Compute mean of mean_corr per alpha from layer_summary
  const points = items.map(it => {
    const rows = it.layer_summary || [];
    const vals = rows.map(r => r.mean_corr).filter(v => typeof v === "number");
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    return { alpha: it.alpha, mean_corr: mean, rows: rows.length };
  }).sort((a, b) => a.alpha - b.alpha);

  return (
    <>
      <PageHeader title="Hyperparameter Sweep" description="Alpha sweep over the HO-31 ROI set." />
      {isLoading && <Skeleton className="h-72" />}
      <ErrorPanel error={error} />

      {points.length > 0 ? (
        <ChartPanel
          title="Mean correlation vs alpha"
          data={[{
            type: "scatter", mode: "lines+markers",
            x: points.map(p => p.alpha), y: points.map(p => p.mean_corr),
            hovertemplate: "alpha=%{x}<br>mean_corr=%{y:.4f}<extra></extra>",
          }]}
          layout={{ xaxis: { title: "alpha", type: "log" }, yaxis: { title: "mean_corr" } }}
        />
      ) : (
        !isLoading && <EmptyHint message="No sweep folders found." />
      )}

      <div className="mt-6">
        <DataGridPanel title="Sweep summary" rows={points} height={300} />
      </div>
    </>
  );
}
