import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import ChartPanel from "../components/ChartPanel.jsx";
import DataGridPanel from "../components/DataGridPanel.jsx";
import AccordionSection from "../components/AccordionSection.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";
import { useUI } from "../store.js";

export default function RoiPerformance({ exp, expLabel, metric }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["layerSummary", exp],
    queryFn: () => api.layerSummary(exp),
    retry: false,
  });
  const selectedRoi = useUI(s => s.selectedRoi);
  const setSelectedRoi = useUI(s => s.setSelectedRoi);

  const rows = data?.data || [];

  const heatmap = useMemo(() => {
    const rois = Array.from(new Set(rows.map(r => r.roi).filter(Boolean))).sort();
    const layers = Array.from(new Set(rows.map(r => r.layer).filter(v => v != null))).sort((a, b) => a - b);
    const z = rois.map(roi => layers.map(layer => {
      const m = rows.find(r => r.roi === roi && r.layer === layer);
      return m ? m[metric] ?? null : null;
    }));
    return { rois, layers, z };
  }, [rows, metric]);

  const filtered = selectedRoi ? rows.filter(r => r.roi === selectedRoi) : rows;

  return (
    <>
      <PageHeader
        title="ROI Performance"
        experiment={expLabel}
        description="ROI x layer heatmap of the selected metric. Click a cell to filter the table below."
      />
      {isLoading && <Skeleton className="h-96" />}
      <ErrorPanel error={error} />

      {heatmap.rois.length > 0 ? (
        <ChartPanel
          title={`Heatmap — ${metric}`}
          data={[{
            type: "heatmap",
            x: heatmap.layers, y: heatmap.rois, z: heatmap.z,
            colorscale: "Viridis",
            hovertemplate: `ROI=%{y}<br>layer=%{x}<br>${metric}=%{z:.4f}<extra></extra>`,
          }]}
          layout={{ xaxis: { title: "Layer" }, yaxis: { title: "ROI", automargin: true } }}
          height={Math.max(360, Math.min(900, heatmap.rois.length * 18 + 120))}
          config={{}}
        />
      ) : (
        !isLoading && <EmptyHint message="No ROI x layer data." />
      )}

      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-ink-400">Filter:</span>
        <select
          value={selectedRoi || ""}
          onChange={e => setSelectedRoi(e.target.value || null)}
          className="text-sm rounded-md border border-ink-200 bg-white px-2 py-1.5"
        >
          <option value="">All ROIs</option>
          {heatmap.rois.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="mt-3">
        <DataGridPanel title="Layer summary" rows={filtered} height={400} />
      </div>

      <div className="mt-6 space-y-3">
        <AccordionSection title="Raw response">
          <pre className="mono text-xs overflow-auto max-h-80">{JSON.stringify(data?.meta, null, 2)}</pre>
        </AccordionSection>
      </div>
    </>
  );
}
