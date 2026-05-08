import { Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import SidebarGroup from "./components/SidebarGroup.jsx";
import { Skeleton } from "./components/Status.jsx";
import { PAGES, SIDEBAR } from "./routes.jsx";

// Routes that take full viewport and manage their own layout
const FULLSCREEN_ROUTES = new Set(["/brain-map"]);

export default function App() {
  const loc = useLocation();
  const currentItem = SIDEBAR.flatMap(g => g.items).find(i => i.to === loc.pathname);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 sticky top-0 h-screen overflow-y-auto scrollbar-thin border-r border-ink-200/70 bg-white/60 backdrop-blur-sm">
        <div className="px-5 pt-6 pb-4">
          <div className="text-[11px] mono uppercase tracking-[0.18em] text-ink-400">Neural Encoding Project</div>
          <div className="serif text-xl font-semibold text-ink-900 leading-tight mt-1">BCCL Coder</div>
          <div className="mt-2 text-sm leading-6 text-ink-500">A trimmed research viewer for the project overview and brain maps.</div>
        </div>
        <nav className="px-2 pb-8">
          {SIDEBAR.map((g) => (
            <SidebarGroup key={g.title} title={g.title} items={g.items} search="" />
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-ink-200/70">
          <div className="px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs text-ink-400">
              <span>BCCL Coder</span>
              {currentItem && <span className="mx-1.5">›</span>}
              {currentItem && <span className="text-ink-800">{currentItem.label}</span>}
            </div>
            <div className="text-xs text-ink-500">Static overview and brain-map explorer</div>
          </div>
        </header>

        <main className={FULLSCREEN_ROUTES.has(loc.pathname) ? "flex-1 min-h-0 flex flex-col overflow-hidden" : "px-8 py-8 max-w-[1400px] w-full mx-auto"}>
          <Suspense fallback={<div className="space-y-4"><Skeleton /><Skeleton /></div>}>
            <Routes>
              <Route path="/" element={<PAGES.Dashboard />} />
              <Route path="/brain-map" element={<PAGES.BrainActivationMap />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="mt-auto px-8 py-4 text-xs text-ink-400 border-t border-ink-200/60">
          Read-only view of <span className="mono">DATA_ROOT</span>. No data is modified.
        </footer>
      </div>
    </div>
  );
}
