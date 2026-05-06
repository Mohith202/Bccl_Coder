export function Skeleton({ className = "h-32" }) {
  return (
    <div className={`animate-pulse rounded-xl bg-ink-100/80 ${className}`} aria-hidden />
  );
}

export function ErrorPanel({ error }) {
  if (!error) return null;
  const expected = error.body?.expectedPath;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-800">
      <div className="font-medium">Could not load data</div>
      <div className="mono mt-1 text-xs break-all">{error.message}</div>
      {expected && (
        <div className="mt-1 text-xs">
          Expected: <span className="mono">{Array.isArray(expected) ? expected.join(" or ") : expected}</span>
        </div>
      )}
    </div>
  );
}

export function EmptyHint({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-ink-400 text-sm">
      {message}
    </div>
  );
}
