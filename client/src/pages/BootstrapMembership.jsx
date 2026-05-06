import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import ChartPanel from "../components/ChartPanel.jsx";
import DataGridPanel from "../components/DataGridPanel.jsx";
import AccordionSection from "../components/AccordionSection.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";

export default function BootstrapMembership({ exp, expLabel }) {
  const mem = useQuery({ queryKey: ["bootstrapMembership", exp], queryFn: () => api.bootstrapMembership(exp), retry: false });
  const sum = useQuery({ queryKey: ["bootstrapSummary", exp], queryFn: () => api.bootstrapSummary(exp), retry: false });

  const rows = mem.data?.data || [];

  // Build a stacked bar of category membership counts per ROI
  const cats = Array.from(new Set(rows.map(r => r.category || r.assigned_category).filter(Boolean)));
  const rois = Array.from(new Set(rows.map(r => r.roi).filter(Boolean)));
  const traces = cats.map(c => ({
    type: "bar", name: c,
    x: rois,
    y: rois.map(r => rows.filter(x => x.roi === r && (x.category || x.assigned_category) === c).length),
    hovertemplate: `<b>${c}</b><br>%{x}: %{y}<extra></extra>`,
  }));

  return (
    <>
      <PageHeader title="Bootstrap ROI Membership" experiment={expLabel} description="ROI category membership across bootstrap samples." />
      {mem.isLoading && <Skeleton className="h-96" />}
      <ErrorPanel error={mem.error} />

      {rois.length > 0 ? (
        <ChartPanel
          title="Membership counts per ROI"
          data={traces}
          layout={{ barmode: "stack", xaxis: { tickangle: -30 } }}
        />
      ) : (
        !mem.isLoading && <EmptyHint message="No membership rows." />
      )}

      <div className="mt-6">
        <DataGridPanel title="Membership rows" rows={rows} height={420} />
      </div>

      <div className="mt-6">
        <AccordionSection title="Bootstrap summary JSON">
          <pre className="mono text-xs overflow-auto max-h-96">{JSON.stringify(sum.data?.data, null, 2)}</pre>
        </AccordionSection>
      </div>
    </>
  );
}
