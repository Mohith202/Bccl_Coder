import { Card } from "./Card.jsx";

export default function MetricCard({ label, value, unit, help }) {
  return (
    <Card className="p-5 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-ink-400">{label}</span>
        {help && (
          <span
            className="text-[10px] rounded-full bg-ink-100 text-ink-600 px-1.5 py-0.5 cursor-help"
            title={help}
            aria-label={help}
          >
            i
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="serif text-3xl font-semibold tabular-nums">
          {value ?? "—"}
        </span>
        {unit && <span className="text-sm text-ink-400 mono">{unit}</span>}
      </div>
    </Card>
  );
}
