import PageHeader from "../components/PageHeader.jsx";
import { Card } from "../components/Card.jsx";
import { resolveAppAssetUrl } from "../api.js";

const PDF_URL = resolveAppAssetUrl("presentation/csai-final-presentation.pdf");

export default function PresentationPage() {
  return (
    <>
      <PageHeader
        title="Presentation Deck"
        description="Slides, figures, and narrative framing from the CSAI final presentation, embedded directly in the app."
        actions={(
          <a
            href={PDF_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            Open PDF in new tab
          </a>
        )}
      />

      <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">What is here</div>
          <div className="mt-2 text-xl font-semibold text-ink-900">Final presentation, inside the dashboard</div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-ink-600">
            <p>The embedded viewer keeps the deck in context while you inspect the underlying results pages.</p>
            <p>Use this tab when you need the project story, prepared visuals, or slide-ready figures instead of raw tables and diagnostic views.</p>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <iframe
            title="CSAI Final Presentation"
            src={`${PDF_URL}#view=FitH`}
            className="h-[82vh] w-full bg-white"
          />
        </Card>
      </section>
    </>
  );
}