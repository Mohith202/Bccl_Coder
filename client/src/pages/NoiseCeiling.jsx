import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import ChartPanel from "../components/ChartPanel.jsx";
import DataGridPanel from "../components/DataGridPanel.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";

export default function NoiseCeiling({ exp, expLabel, metric }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bestVsNc", exp],
    queryFn: () => api.bestLayerVsNc(exp),
    retry: false,
  });
  const rows = data?.data || [];

  // Try common columns
  const xKey = rows[0] && ("noise_ceiling" in rows[0] ? "noise_ceiling" : Object.keys(rows[0]).find(k => /noise/i.test(k)));
  const yKey = rows[0] && (metric in rows[0] ? metric : Object.keys(rows[0]).find(k => /best|corr|score/i.test(k)));

  const xs = rows.map(r => r[xKey]).filter(v => typeof v === "number");
  const ys = rows.map(r => r[yKey]).filter(v => typeof v === "number");
  const max = Math.max(...xs, ...ys, 1);

  return (
    <>
      <PageHeader title="Noise Ceiling Analysis" experiment={expLabel} description="Best-layer score vs noise ceiling per ROI." />
      {isLoading && <Skeleton className="h-96" />}
      <ErrorPanel error={error} />

      {rows.length > 0 && xKey && yKey ? (
        <ChartPanel
          title={`${yKey} vs ${xKey}`}
          data={[
            {
              type: "scatter", mode: "markers", x: rows.map(r => r[xKey]), y: rows.map(r => r[yKey]),
              text: rows.map(r => r.roi || ""), hovertemplate: "<b>%{text}</b><br>nc=%{x:.3f}<br>score=%{y:.3f}<extra></extra>",
              marker: { size: 9 },
            },
            { type: "scatter", mode: "lines", x: [0, max], y: [0, max], line: { dash: "dash", color: "#9ca3af" }, name: "y = x", showlegend: false },
          ]}
          layout={{ xaxis: { title: xKey }, yaxis: { title: yKey } }}
        />
      ) : (
        !isLoading && <EmptyHint message="No noise-ceiling data." />
      )}

      <div className="mt-6">
        <DataGridPanel title="Best-layer vs noise-ceiling rows" rows={rows} height={420} />
      </div>
    </>
  );
}
