import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import AccordionSection from "../components/AccordionSection.jsx";
import { Card } from "../components/Card.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";

export default function QualityControl({ exp, expLabel }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["qc", exp], queryFn: () => api.qc(exp), retry: false,
  });
  const blocks = data?.data || {};
  const keys = Object.keys(blocks);

  return (
    <>
      <PageHeader title="Quality Control" experiment={expLabel} description="QC summaries for alignment, masks, manifests, and features." />
      {isLoading && <Skeleton className="h-64" />}
      <ErrorPanel error={error} />

      {keys.length === 0 && !isLoading && <EmptyHint message="No QC files found for this experiment." />}

      <div className="grid gap-4 md:grid-cols-2">
        {keys.map(k => (
          <Card key={k} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-ink-800">{k.replace(/\.json$/, "")}</h3>
              <span className="text-[11px] text-ink-400 mono truncate max-w-[60%]">{blocks[k].source}</span>
            </div>
            <AccordionSection title="View JSON" defaultOpen={false}>
              <pre className="mono text-xs overflow-auto max-h-80">{JSON.stringify(blocks[k].data, null, 2)}</pre>
            </AccordionSection>
          </Card>
        ))}
      </div>
    </>
  );
}
