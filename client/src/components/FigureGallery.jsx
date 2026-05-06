import clsx from "clsx";

function isWideFigure(name) {
  return /brain|heatmap|isc_per_category/i.test(name || "");
}

export default function FigureGallery({ items = [] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {items.map((f) => {
        const wide = isWideFigure(f.name);
        return (
          <figure
            key={f.url}
            className={clsx(
              "rounded-xl border border-ink-200/70 bg-white/70 p-3 shadow-card",
              wide && "md:col-span-2"
            )}
          >
            <figcaption className="text-sm text-ink-600 mb-2">
              <span className="font-medium text-ink-800">{f.label}</span>
              <span className="block text-xs text-ink-400 mono truncate">{f.rel}</span>
            </figcaption>
            <img
              src={f.url}
              alt={f.label}
              loading="lazy"
              className="w-full h-auto rounded-md"
            />
          </figure>
        );
      })}
    </div>
  );
}
