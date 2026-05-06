import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import AccordionSection from "../components/AccordionSection.jsx";
import FigureGallery from "../components/FigureGallery.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";

export default function FigureGalleryPage({ exp, expLabel }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["figures", exp], queryFn: () => api.figures(exp), retry: false,
  });
  const groups = data?.data?.groups || {};
  const groupKeys = Object.keys(groups).sort();

  return (
    <>
      <PageHeader
        title="Figure Gallery"
        experiment={expLabel}
        description="Pre-generated PNGs from the experiment, grouped by source folder."
      />
      {isLoading && <Skeleton className="h-72" />}
      <ErrorPanel error={error} />

      {groupKeys.length === 0 && !isLoading && !error && <EmptyHint message="No figures found." />}

      <div className="space-y-3">
        {groupKeys.map(g => (
          <AccordionSection key={g} title={g === "." ? "(root)" : g} count={groups[g].length} defaultOpen={groupKeys.length <= 3}>
            <FigureGallery items={groups[g]} />
          </AccordionSection>
        ))}
      </div>
    </>
  );
}
