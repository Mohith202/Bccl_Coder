import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import ChartPanel from "../components/ChartPanel.jsx";
import DataGridPanel from "../components/DataGridPanel.jsx";
import AccordionSection from "../components/AccordionSection.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";

export default function VoxelMapping({ exp, expLabel }) {
  const voxel = useQuery({ queryKey: ["iscVoxel", exp], queryFn: () => api.iscVoxel(exp), retry: false });
  const summary = useQuery({ queryKey: ["topVoxels", exp], queryFn: () => api.topVoxels(exp), retry: false });

  const rows = voxel.data?.data || [];

  const byRegion = {};
  for (const r of rows) {
    const reg = r.region || r.roi || r.harvard_oxford || "unknown";
    byRegion[reg] = (byRegion[reg] || 0) + 1;
  }
  const labels = Object.keys(byRegion).sort((a, b) => byRegion[b] - byRegion[a]).slice(0, 25);
  const counts = labels.map(l => byRegion[l]);

  return (
    <>
      <PageHeader title="Voxel Mapping" experiment={expLabel} description="Top voxels grouped by anatomical region." />
      {voxel.isLoading && <Skeleton className="h-80" />}
      <ErrorPanel error={voxel.error} />

      {labels.length > 0 ? (
        <ChartPanel
          title="Top voxels per region"
          data={[{ type: "bar", x: counts, y: labels, orientation: "h", hovertemplate: "%{y}: %{x}<extra></extra>" }]}
          layout={{ xaxis: { title: "voxels" }, yaxis: { automargin: true }, height: Math.max(360, labels.length * 20 + 120) }}
          height={Math.max(360, labels.length * 20 + 120)}
        />
      ) : (
        !voxel.isLoading && <EmptyHint message="No voxel mapping data." />
      )}

      <div className="mt-6">
        <DataGridPanel title="Voxel mapping rows" rows={rows} height={420} />
      </div>

      <div className="mt-6">
        <AccordionSection title="Top-voxels summary JSON">
          <pre className="mono text-xs overflow-auto max-h-96">{JSON.stringify(summary.data?.data, null, 2)}</pre>
        </AccordionSection>
      </div>
    </>
  );
}
