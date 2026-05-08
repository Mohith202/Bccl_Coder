import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Plot from "react-plotly.js";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../components/Card.jsx";
import { Skeleton, ErrorPanel } from "../components/Status.jsx";
import { api } from "../api.js";
import { applyTheme } from "../theme.js";

function fmt(value, digits = 4) {
  if (value == null || Number.isNaN(value)) return "—";
  return typeof value === "number" ? value.toFixed(digits) : value;
}

function humanize(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function StatCard({ label, value, note }) {
  return (
    <Card className="p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">{label}</div>
      <div className="mt-2 serif text-3xl font-semibold tabular-nums text-ink-900">{value}</div>
      {note && <div className="mt-2 text-sm text-ink-500">{note}</div>}
    </Card>
  );
}

function ControlPanel({ selectors, onModelChange, onSubjectChange }) {
  return (
    <Card className="p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_auto] lg:items-end">
        <div>
          <label className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Model run</label>
          <select
            className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-indigo-400"
            value={selectors?.selectedModel ?? ""}
            onChange={event => onModelChange(event.target.value)}
          >
            {(selectors?.models ?? []).map(option => (
              <option key={option} value={option}>{humanize(option)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Participant subject</label>
          <select
            className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-indigo-400"
            value={selectors?.selectedSubject ?? ""}
            onChange={event => onSubjectChange(event.target.value)}
          >
            {(selectors?.availableSubjects ?? []).map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-ink-200/70 bg-[#f7f3ea] px-4 py-3 text-sm text-ink-600">
          <div className="text-[11px] uppercase tracking-[0.16em] text-ink-400">Interactive view</div>
          <div className="mt-1 font-medium text-ink-900">Per-subject HO31 test split</div>
        </div>
      </div>
    </Card>
  );
}

function BrainSurfaceCard({ imageUrl, caption }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-200/70 px-5 py-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Brain activation map</div>
        <div className="mt-1 text-lg font-semibold text-ink-900">Mean correlation surface</div>
      </div>
      <div className="bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_transparent_58%)] p-5">
        <img
          src={imageUrl}
          alt={caption}
          className="mx-auto max-h-[460px] w-full rounded-xl object-contain"
          loading="lazy"
        />
      </div>
      <div className="border-t border-ink-200/70 px-5 py-4 text-sm leading-6 text-ink-600">{caption}</div>
    </Card>
  );
}

function ConfigRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-ink-100 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="text-sm text-ink-500">{label}</div>
      <div className={`text-right text-sm text-ink-900 ${mono ? "mono break-all" : "font-medium"}`}>{value ?? "—"}</div>
    </div>
  );
}

function RunConfigCard({ summary, runConfig }) {
  return (
    <Card className="p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Run configuration</div>
      <div className="mt-1 text-lg font-semibold text-ink-900">Selected model metadata</div>
      <div className="mt-5">
        <ConfigRow label="Dataset" value={runConfig?.dataset ?? summary?.dataset} />
        <ConfigRow label="Model alias" value={humanize(runConfig?.model_alias ?? summary?.model_alias)} />
        <ConfigRow label="Model label" value={summary?.model} />
        <ConfigRow label="Subject" value={summary?.subject} mono />
        <ConfigRow label="Alpha" value={summary?.fit_summary_excerpt?.alpha ?? "default"} />
        <ConfigRow label="Best layer" value={summary?.layer} />
        <ConfigRow label="Rows in test split" value={summary?.n_rows_test_split} />
        <ConfigRow label="Painted ROIs" value={summary?.n_rois_painted} />
        <ConfigRow label="Metric" value={humanize(runConfig?.metric ?? summary?.protocol)} />
        <ConfigRow label="Model slug" value={runConfig?.model_slug ?? summary?.model_slug} mono />
      </div>
    </Card>
  );
}

function TopRoiList({ rows }) {
  const topRows = rows.slice(0, 8);

  return (
    <Card className="p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Best ROIs</div>
      <div className="mt-1 text-lg font-semibold text-ink-900">Top regional correlations</div>
      <div className="mt-5 space-y-3">
        {topRows.map((row, index) => (
          <div key={row.roi_name}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="font-medium text-ink-800">{index + 1}. {humanize(row.roi_name)}</div>
              <div className="mono tabular-nums text-ink-500">{fmt(row.corr)}</div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-ink-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500"
                style={{ width: `${Math.max(8, Math.min(100, ((row.corr ?? 0) / (topRows[0]?.corr || 1)) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RoiDistribution({ rows }) {
  const topRows = rows.slice(0, 12);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">ROI distribution</div>
          <div className="mt-1 text-lg font-semibold text-ink-900">Top 12 regions by correlation</div>
        </div>
        <div className="text-xs text-ink-500">mean_corr_per_roi_best_layer.csv</div>
      </div>
      <Plot
        data={[
          {
            type: "bar",
            orientation: "h",
            y: topRows.map(row => humanize(row.roi_name)).reverse(),
            x: topRows.map(row => row.corr).reverse(),
            marker: {
              color: topRows.map(() => "#4f46e5").reverse(),
              opacity: 0.92,
            },
            hovertemplate: "%{y}<br>corr=%{x:.4f}<extra></extra>",
          },
        ]}
        layout={applyTheme({
          height: 420,
          margin: { l: 120, r: 24, t: 10, b: 40 },
          xaxis: { title: "correlation (r)" },
          yaxis: { automargin: true },
        })}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%" }}
      />
    </Card>
  );
}

export default function BrainActivationMap() {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedModel = searchParams.get("model") || "";
  const requestedSubject = searchParams.get("subject") || "";

  // Load selectors first to pick defaults when no query params are set
  const selectorsQuery = useQuery({
    queryKey: ["brain-map-selectors"],
    queryFn: api.brainMapSelectors,
    staleTime: Infinity,
  });

  const defaultModel = selectorsQuery.data?.models?.[0] ?? "";
  const effectiveModel = requestedModel || defaultModel;
  const defaultSubject = selectorsQuery.data?.combinations?.find(c => c.modelLabel === effectiveModel)?.subjects?.[0] ?? "";
  const effectiveSubject = requestedSubject || defaultSubject;

  const exportQuery = useQuery({
    queryKey: ["dashboard-export", effectiveModel, effectiveSubject],
    queryFn: () => api.dashboardExport(effectiveModel, effectiveSubject),
    enabled: !!effectiveModel && !!effectiveSubject,
    staleTime: Infinity,
  });

  const data = exportQuery.data?.data;
  const summary = data?.summary;
  const runConfig = data?.runConfig;
  const manifest = data?.manifest;
  // Merge selectors: per-subject selectors from export JSON, supplemented by root selectors
  const selectors = data?.selectors ?? selectorsQuery.data ?? null;
  const roiScores = useMemo(() => {
    const rows = data?.roiScores ?? [];
    return rows.slice().sort((left, right) => (right.corr ?? -Infinity) - (left.corr ?? -Infinity));
  }, [data?.roiScores]);
  const peakCorrelationNote = [
    summary?.max_corr_layer != null ? `Layer ${summary.max_corr_layer}` : null,
    summary?.max_corr_roi ? humanize(summary.max_corr_roi) : null,
    summary?.max_corr_run != null ? `Run ${summary.max_corr_run}` : null,
  ].filter(Boolean).join(" · ");

  const updateSelection = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,_#fcfbf7_0%,_#f6f2e8_100%)] px-6 py-8 text-ink-900 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="grid gap-6 rounded-[32px] border border-ink-200/70 bg-white/80 p-6 shadow-card lg:grid-cols-[minmax(0,1.25fr)_320px] lg:p-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink-400">Interactive model explorer</div>
            <h1 className="mt-3 serif text-4xl font-semibold leading-tight text-ink-900 lg:text-5xl">
              Per-subject neural encoding results, without the raw dashboard clutter.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-ink-600">
              This view follows the LitCoder-style flow: choose a model run, switch to an individual participant subject, and inspect the headline correlation statistics together with the brain surface map.
            </p>
          </div>

          <div className="rounded-[28px] border border-ink-200/70 bg-[#f8f4eb] p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Quick links</div>
            <div className="mt-4 space-y-3 text-sm">
              <Link to="/" className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 font-medium text-ink-800 transition hover:border-indigo-300 hover:text-indigo-700">
                Return to overview
              </Link>
            </div>
          </div>
        </section>

        {exportQuery.isLoading && (
          <div className="grid gap-4">
            <Skeleton className="h-32" />
            <div className="grid gap-4 lg:grid-cols-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
              <Skeleton className="h-[540px]" />
              <Skeleton className="h-[540px]" />
            </div>
          </div>
        )}

        {exportQuery.isError && <ErrorPanel error={exportQuery.error} />}

        {!exportQuery.isLoading && !exportQuery.isError && (
          <>
            <ControlPanel
              selectors={selectors}
              onModelChange={(value) => updateSelection({ model: value, subject: null })}
              onSubjectChange={(value) => updateSelection({ subject: value })}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Mean correlation" value={fmt(summary?.mean_corr)} note={`Across ${summary?.n_rois ?? 0} ROIs`} />
              <StatCard label="Peak correlation" value={fmt(summary?.max_corr)} note={peakCorrelationNote || null} />
              <StatCard label="Best layer" value={summary?.layer ?? "—"} note={summary?.model_alias ? humanize(summary.model_alias) : null} />
              <StatCard label="Painted ROIs" value={summary?.n_rois_painted ?? summary?.n_rois ?? "—"} note={summary?.subject ? `Subject ${summary.subject}` : null} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
              <BrainSurfaceCard
                imageUrl={manifest?.modes?.prediction?.surface}
                caption={manifest?.note || `Mean correlation surface for ${summary?.model ?? "—"} on ${summary?.subject ?? "—"}.`}
              />

              <div className="space-y-4">
                <RunConfigCard summary={summary} runConfig={runConfig} />
                <TopRoiList rows={roiScores} />
              </div>
            </section>

            <RoiDistribution rows={roiScores} />
          </>
        )}
      </div>
    </div>
  );
}
