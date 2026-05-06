import clsx from "clsx";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-white/80 backdrop-blur-sm border border-ink-200/70 shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
