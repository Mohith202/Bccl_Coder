export default function PageHeader({ title, experiment, description, actions }) {
  return (
    <header className="flex flex-col gap-2 mb-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="serif text-3xl font-semibold leading-tight text-ink-900">
            {title}
            {experiment && (
              <span className="text-ink-400 font-normal"> — {experiment}</span>
            )}
          </h1>
          {description && <p className="caption mt-1 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="divider" />
    </header>
  );
}
