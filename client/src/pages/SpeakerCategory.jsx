import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import ChartPanel from "../components/ChartPanel.jsx";
import DataGridPanel from "../components/DataGridPanel.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";
import { CATEGORY_COLORS, normalizeCategory } from "../theme.js";

export default function SpeakerCategory({ exp, expLabel, metric }) {
  const protoC = useQuery({ queryKey: ["protocolC", exp], queryFn: () => api.protocolC(exp), retry: false });
  const isc = useQuery({ queryKey: ["iscSummary", exp], queryFn: () => api.iscSummary(exp), retry: false });

  const rows = protoC.data?.data || [];

  // Box per category
  const cats = ["single_male", "single_female", "mixed_male", "mixed_female"];
  const valueKey = rows[0] && (metric in rows[0] ? metric : Object.keys(rows[0]).find(k => /corr|score/i.test(k)));
  const traces = cats.map(c => {
    const ys = rows
      .filter(r => normalizeCategory(r.category || r.speaker_category || "") === c)
      .map(r => r[valueKey])
      .filter(v => typeof v === "number");
    return { type: "box", name: c, y: ys, marker: { color: CATEGORY_COLORS[c] }, boxmean: true };
  });

  return (
    <>
      <PageHeader title="Speaker Category Analysis" experiment={expLabel} description="Per-category distribution under Protocol-C." />
      {protoC.isLoading && <Skeleton className="h-96" />}
      <ErrorPanel error={protoC.error} />

      {valueKey && traces.some(t => t.y.length) ? (
        <ChartPanel title={`${valueKey} by category`} data={traces} layout={{ yaxis: { title: valueKey } }} />
      ) : (
        !protoC.isLoading && <EmptyHint message="No Protocol-C category rows found." />
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DataGridPanel title="Protocol-C rows" rows={rows} height={400} />
        <DataGridPanel title="ISC summary by category" rows={isc.data?.data || []} height={400} />
      </div>
    </>
  );
}
