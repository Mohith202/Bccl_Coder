import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { Card } from "../components/Card.jsx";
import { Skeleton, ErrorPanel, EmptyHint } from "../components/Status.jsx";
import { api } from "../api.js";

function fmt(value, digits = 4) {
  if (value == null || Number.isNaN(value)) return "—";
  return typeof value === "number" ? value.toFixed(digits) : value;
}

function humanize(value) {
  return String(value || "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

export default function Dashboard() {
  const selectorsQuery = useQuery({
    queryKey: ["brain-map-selectors"],
    queryFn: api.brainMapSelectors,
    staleTime: Infinity,
    retry: false,
  });

  const sampleModel = selectorsQuery.data?.models?.[0] ?? "";
  const sampleSubject = selectorsQuery.data?.combinations?.find(item => item.modelLabel === sampleModel)?.subjects?.[0] ?? "";

  const sampleQuery = useQuery({
    queryKey: ["overview-sample", sampleModel, sampleSubject],
    queryFn: () => api.dashboardExport(sampleModel, sampleSubject),
    enabled: !!sampleModel && !!sampleSubject,
    staleTime: Infinity,
    retry: false,
  });

  const summary = sampleQuery.data?.data?.summary ?? null;
  const roiScores = (sampleQuery.data?.data?.roiScores ?? [])
    .slice()
    .sort((left, right) => (right.corr ?? -Infinity) - (left.corr ?? -Infinity));
  const topRois = roiScores.slice(0, 5);
  const modelRuns = selectorsQuery.data?.models ?? [];
  const combinations = selectorsQuery.data?.combinations ?? [];
  const totalSubjects = new Set(combinations.flatMap(item => item.subjects ?? [])).size;
  const totalViews = combinations.reduce((count, item) => count + (item.subjects?.length ?? 0), 0);
  const isLoading = selectorsQuery.isLoading || sampleQuery.isLoading;
  const error = selectorsQuery.error || sampleQuery.error;

  return (
    <>
      <PageHeader
        title="Overview"
        experiment={summary?.dataset ?? "Static explorer"}
        description="A working entry point into the project: live counts from the static brain-map dataset, a representative model snapshot, and a direct path into the interactive explorer."
      />

      <section className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <Card className="overflow-hidden p-6 lg:p-7">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-400">Static overview</div>
          <h2 className="mt-3 serif text-3xl font-semibold leading-tight text-ink-900 lg:text-4xl">
            A reliable landing page built from the data that is actually present.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-600">
            The earlier overview depended on summary files that are empty in this static deploy. This version uses the populated per-subject brain-map exports so the first screen has real counts and headline results.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/brain-map" className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100">
              Open interactive explorer
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Representative sample</div>
          <div className="mt-2 text-xl font-semibold text-ink-900">{summary?.model ? humanize(summary.model) : "Loading sample"}</div>
          <div className="mt-5 space-y-4 text-sm text-ink-600">
            <div className="flex items-start justify-between gap-4 border-t border-ink-100 pt-4 first:border-t-0 first:pt-0">
              <span>Subject</span>
              <span className="font-medium text-ink-900">{summary?.subject ?? sampleSubject ?? "—"}</span>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-ink-100 pt-4">
              <span>Best layer</span>
              <span className="font-medium text-ink-900">{summary?.layer ?? "—"}</span>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-ink-100 pt-4">
              <span>Peak ROI</span>
              <span className="font-medium text-ink-900">{summary?.max_corr_roi ? humanize(summary.max_corr_roi) : "—"}</span>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-ink-100 pt-4">
              <span>Peak correlation</span>
              <span className="font-medium text-ink-900">{fmt(summary?.max_corr)}</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <MetricCard label="Model runs" value={modelRuns.length || "—"} unit="runs" help="Available model outputs in the static dataset" />
        <MetricCard label="Subjects" value={totalSubjects || "—"} unit="subjects" help="Distinct participants available in the explorer" />
        <MetricCard label="Sample ROIs" value={summary?.n_rois_painted ?? summary?.n_rois ?? "—"} unit="ROI" help="Painted ROIs in the representative export" />
        <MetricCard label="Available views" value={totalViews || "—"} unit="maps" help="Model-subject combinations shipped in the app" />
      </section>

      {isLoading && <Skeleton className="h-96" />}
      <ErrorPanel error={error} />

      {!summary && !isLoading && !error && (
        <EmptyHint message="No populated static overview source was found." />
      )}

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Top ROI headlines</div>
          <div className="mt-2 text-xl font-semibold text-ink-900">Highest correlations in the sample export</div>
          <div className="mt-5 space-y-4">
            {topRois.map((row, index) => (
              <div key={`${row.roi_name}-${index}`} className="flex items-center justify-between gap-4 border-t border-ink-100 pt-4 first:border-t-0 first:pt-0">
                <div>
                  <div className="font-medium text-ink-900">{humanize(row.roi_name)}</div>
                  <div className="text-sm text-ink-500">Representative subject {summary?.subject ?? "—"}</div>
                </div>
                <div className="mono tabular-nums text-sm text-ink-600">{fmt(row.corr)}</div>
              </div>
            ))}
            {topRois.length === 0 && <div className="text-sm text-ink-500">No ROI scores available in the sample export.</div>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Next steps</div>
          <div className="mt-2 text-xl font-semibold text-ink-900">Continue into the interactive explorer</div>
          <div className="mt-5 space-y-3 text-sm">
            <Link to="/brain-map" className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 font-medium text-ink-800 transition hover:border-indigo-300 hover:text-indigo-700">
              Open the full per-subject brain-map explorer
            </Link>
            <div className="rounded-2xl border border-ink-200 bg-[#faf7f0] px-4 py-3 text-ink-600">
              Default launch target: {sampleModel ? humanize(sampleModel) : "—"} / {sampleSubject || "—"}
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
