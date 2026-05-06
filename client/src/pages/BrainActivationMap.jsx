import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Plot from "react-plotly.js";
import { Skeleton, ErrorPanel } from "../components/Status.jsx";
import { applyTheme, CATEGORY_COLORS } from "../theme.js";

const MODE_OPTS = [
  { value: "prediction", label: "Prediction" },
  { value: "truth", label: "Ground Truth" },
  { value: "error", label: "Error" },
];

const METRIC_OPTS = [
  { value: "corr", label: "Correlation (r)" },
  { value: "r2", label: "R²" },
  { value: "2v2_accuracy", label: "2v2 Accuracy" },
  { value: "pred_mean", label: "Prediction Mean" },
  { value: "truth_mean", label: "Truth Mean" },
  { value: "error", label: "Signed Error" },
  { value: "abs_error", label: "Absolute Error" },
];

async function fetchJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.message || response.statusText || "Request failed");
    error.body = body;
    throw error;
  }
  return body;
}

function fmt(value, digits = 4) {
  if (value == null || Number.isNaN(value)) return "—";
  return typeof value === "number" ? value.toFixed(digits) : value;
}

function humanize(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function metricLabel(metric) {
  return METRIC_OPTS.find(option => option.value === metric)?.label ?? humanize(metric);
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function Sidebar({ summary, anatomyRows, mode, onMode, metric, onMetric, metricOptions, colorRange }) {
  return (
    <aside className="w-72 shrink-0 border-r border-gray-800 bg-black/30 p-5 overflow-y-auto">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Source</div>
        <div className="mt-2 text-sm font-medium text-gray-100">Local dashboard export</div>
        <div className="mt-1 text-xs text-gray-500">dashboard_export/brain_maps_manifest.json</div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-gray-800 bg-gray-900/70 p-4 text-sm text-gray-300">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Subject</div>
          <div className="mt-1 leading-snug">{summary?.subject ?? "—"}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Model</div>
          <div className="mt-1 leading-snug">{summary?.model ?? "—"}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Protocol</div>
            <div className="mt-1">{summary?.protocol ?? "—"}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Layer</div>
            <div className="mt-1">{summary?.layer ?? "—"}</div>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Alpha</div>
          <div className="mt-1">{summary?.fit_summary_excerpt?.alpha ?? "—"}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Map Mode</label>
        <select
          className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-400"
          value={mode}
          onChange={event => onMode(event.target.value)}
        >
          {MODE_OPTS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <label className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">ROI Metric</label>
        <select
          className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-400"
          value={metric}
          onChange={event => onMetric(event.target.value)}
        >
          {metricOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/70 p-4 text-sm text-gray-300">
        <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Color Range</div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-500">Min</div>
            <div className="mt-1 tabular-nums text-gray-100">{fmt(colorRange?.vmin, 3)}</div>
          </div>
          <div>
            <div className="text-gray-500">Max</div>
            <div className="mt-1 tabular-nums text-gray-100">{fmt(colorRange?.vmax, 3)}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-500">Colormap</div>
            <div className="mt-1 text-gray-100">{colorRange?.cmap ?? "—"}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/70 p-4 text-sm text-gray-300">
        <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Painted Anatomy</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {anatomyRows.map(row => (
            <span key={row.roi_name} className="rounded-full border border-gray-700 px-2.5 py-1 text-xs text-gray-200">
              {row.roi_name}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

function StatsBar({ summary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-6">
      <MetricCard label="Mean Correlation" value={fmt(summary?.mean_corr)} accent="text-indigo-300" />
      <MetricCard label="Mean Abs Error" value={fmt(summary?.mean_abs_error)} accent="text-rose-300" />
      <MetricCard label="Best ROI" value={summary?.best_roi ?? "—"} accent="text-emerald-300" />
      <MetricCard label="Worst ROI" value={summary?.worst_roi ?? "—"} accent="text-amber-300" />
      <MetricCard label="ROIs" value={summary?.n_rois ?? "—"} accent="text-sky-300" />
    </div>
  );
}

function BrainMapTile({ view, src }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-gray-800 bg-[#05070c]">
      <div className="flex min-h-[240px] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_55%)] p-4">
        <img
          src={src}
          alt={humanize(view)}
          className="max-h-[320px] w-full object-contain"
          loading="lazy"
        />
      </div>
      <figcaption className="border-t border-gray-800 px-4 py-3 text-sm text-gray-300">
        {humanize(view)}
      </figcaption>
    </figure>
  );
}

function BrainMapsSection({ manifest, mode }) {
  const views = manifest?.views ?? [];
  const modeMaps = manifest?.modes?.[mode] ?? {};
  const colorRange = manifest?.color_ranges?.[mode];

  return (
    <section className="mb-6 rounded-[28px] border border-gray-800 bg-gray-900/70 p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Brain Maps</div>
          <h2 className="mt-1 text-2xl font-semibold text-white">{MODE_OPTS.find(option => option.value === mode)?.label ?? humanize(mode)}</h2>
        </div>
        <div className="rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-300">
          {`Range ${fmt(colorRange?.vmin, 3)} to ${fmt(colorRange?.vmax, 3)} · ${colorRange?.cmap ?? "—"}`}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {views.map(view => (
          <BrainMapTile key={view} view={view} src={modeMaps[view]} />
        ))}
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-6 text-gray-400">{manifest?.note}</p>
    </section>
  );
}

function RoiComparisonChart({ rows }) {
  if (!rows?.length) return <div className="text-sm text-gray-500">No ROI scores found.</div>;

  const ordered = [...rows].sort((left, right) => left.roi_name.localeCompare(right.roi_name));
  const labels = ordered.map(row => humanize(row.roi_name));

  return (
    <Plot
      data={[
        {
          type: "bar",
          name: "Ground truth",
          x: labels,
          y: ordered.map(row => row.truth_mean),
          marker: { color: "#94a3b8", opacity: 0.9 },
        },
        {
          type: "bar",
          name: "Prediction",
          x: labels,
          y: ordered.map(row => row.pred_mean),
          marker: {
            color: ordered.map(row => CATEGORY_COLORS[row.roi_name] ?? "#818cf8"),
            opacity: 0.92,
          },
        },
      ]}
      layout={applyTheme({
        title: { text: "Prediction vs Ground Truth", font: { size: 14 } },
        barmode: "group",
        height: 360,
        margin: { l: 50, r: 20, t: 50, b: 90 },
        xaxis: { tickangle: -25, automargin: true },
        yaxis: { title: "Mean activation", range: [0, 1.1] },
        legend: { orientation: "h", y: -0.2 },
      })}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%" }}
    />
  );
}

function MetricBarChart({ rows, metric }) {
  if (!rows?.length) return <div className="text-sm text-gray-500">No metric data available.</div>;

  const ordered = [...rows].sort((left, right) => (right[metric] ?? -Infinity) - (left[metric] ?? -Infinity));
  const labels = ordered.map(row => humanize(row.roi_name));
  const values = ordered.map(row => row[metric]);
  const numericValues = values.filter(Number.isFinite);
  const hasNegative = numericValues.some(value => value < 0);

  return (
    <Plot
      data={[
        {
          type: "bar",
          x: labels,
          y: values,
          marker: {
            color: ordered.map(row => CATEGORY_COLORS[row.roi_name] ?? "#818cf8"),
            opacity: 0.92,
          },
          text: values.map(value => fmt(value)),
          textposition: "outside",
          cliponaxis: false,
          hovertemplate: "%{x}<br>%{y:.4f}<extra></extra>",
        },
      ]}
      layout={applyTheme({
        title: { text: `${metricLabel(metric)} by ROI`, font: { size: 14 } },
        height: 360,
        margin: { l: 50, r: 20, t: 50, b: 90 },
        xaxis: { tickangle: -25, automargin: true },
        yaxis: numericValues.length
          ? {
              title: metricLabel(metric),
              range: [
                hasNegative ? Math.min(...numericValues, 0) * 1.15 : 0,
                Math.max(...numericValues, 0) * 1.15 || 1,
              ],
            }
          : { title: metricLabel(metric) },
        shapes: hasNegative
          ? [{ type: "line", x0: -0.5, x1: labels.length - 0.5, y0: 0, y1: 0, line: { color: "#94a3b8", dash: "dot", width: 1 } }]
          : [],
      })}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%" }}
    />
  );
}

function ScoreTable({ rows }) {
  const ordered = [...rows].sort((left, right) => left.roi_name.localeCompare(right.roi_name));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-950/80 text-left text-xs uppercase tracking-[0.16em] text-gray-500">
          <tr>
            <th className="px-4 py-3">ROI</th>
            <th className="px-4 py-3">Pred</th>
            <th className="px-4 py-3">Truth</th>
            <th className="px-4 py-3">Error</th>
            <th className="px-4 py-3">Abs Error</th>
            <th className="px-4 py-3">Corr</th>
            <th className="px-4 py-3">R²</th>
            <th className="px-4 py-3">2v2</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map(row => (
            <tr key={row.roi_name} className="border-t border-gray-800 text-gray-200">
              <td className="px-4 py-3 font-medium">{humanize(row.roi_name)}</td>
              <td className="px-4 py-3 tabular-nums">{fmt(row.pred_mean)}</td>
              <td className="px-4 py-3 tabular-nums">{fmt(row.truth_mean)}</td>
              <td className="px-4 py-3 tabular-nums">{fmt(row.error)}</td>
              <td className="px-4 py-3 tabular-nums">{fmt(row.abs_error)}</td>
              <td className="px-4 py-3 tabular-nums">{fmt(row.corr)}</td>
              <td className="px-4 py-3 tabular-nums">{fmt(row.r2)}</td>
              <td className="px-4 py-3 tabular-nums">{fmt(row["2v2_accuracy"])} </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BrainActivationMap() {
  const [mode, setMode] = useState("prediction");
  const [metric, setMetric] = useState("corr");

  const exportQuery = useQuery({
    queryKey: ["dashboard-export"],
    queryFn: () => fetchJson("/api/dashboard-export"),
    staleTime: 10 * 60 * 1000,
  });

  const data = exportQuery.data?.data;
  const summary = data?.summary;
  const manifest = data?.manifest;
  const roiScores = data?.roiScores ?? [];
  const anatomyRows = (data?.roiLookup ?? []).filter(row => row.kind === "anatomical_language_roi");
  const metricOptions = METRIC_OPTS.filter(option => (data?.metricFields ?? []).includes(option.value));
  const colorRange = manifest?.color_ranges?.[mode] ?? summary?.color_ranges?.[mode];

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-gray-950 text-white">
      {exportQuery.isLoading ? (
        <aside className="w-72 shrink-0 border-r border-gray-800 p-5">
          <Skeleton className="h-80" />
        </aside>
      ) : (
        <Sidebar
          summary={summary}
          anatomyRows={anatomyRows}
          mode={mode}
          onMode={setMode}
          metric={metric}
          onMetric={setMetric}
          metricOptions={metricOptions}
          colorRange={colorRange}
        />
      )}

      <main className="flex-1 overflow-y-auto p-6">
        <header className="mb-6">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Brain activation map</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Downloaded Export Viewer</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            This page now reads directly from the local dashboard export files you downloaded. The four PNG panels come from the exported brain maps, and the charts below summarize the corresponding ROI score table.
          </p>
        </header>

        {exportQuery.isLoading && (
          <div className="grid gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-[420px]" />
            <div className="grid gap-4 xl:grid-cols-2">
              <Skeleton className="h-[380px]" />
              <Skeleton className="h-[380px]" />
            </div>
          </div>
        )}

        {exportQuery.isError && <ErrorPanel error={exportQuery.error} />}

        {!exportQuery.isLoading && !exportQuery.isError && (
          <>
            <StatsBar summary={summary} />
            <BrainMapsSection manifest={manifest} mode={mode} />

            <div className="mb-6 grid gap-6 xl:grid-cols-2">
              <section className="rounded-[28px] border border-gray-800 bg-gray-900/70 p-5">
                <div className="mb-3 text-sm font-medium text-gray-200">ROI predictions</div>
                <div className="text-xs text-gray-500">From roi_scores.csv at protocol {summary?.protocol ?? "—"}, layer {summary?.layer ?? "—"}</div>
                <div className="mt-4">
                  <RoiComparisonChart rows={roiScores} />
                </div>
              </section>

              <section className="rounded-[28px] border border-gray-800 bg-gray-900/70 p-5">
                <div className="mb-3 text-sm font-medium text-gray-200">Selected ROI metric</div>
                <div className="text-xs text-gray-500">Current metric: {metricLabel(metric)}</div>
                <div className="mt-4">
                  <MetricBarChart rows={roiScores} metric={metric} />
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-[28px] border border-gray-800 bg-gray-900/70">
              <div className="border-b border-gray-800 px-5 py-4">
                <div className="text-sm font-medium text-gray-200">ROI score table</div>
                <div className="mt-1 text-xs text-gray-500">All numeric fields are loaded from the local export without additional aggregation.</div>
              </div>
              <ScoreTable rows={roiScores} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
