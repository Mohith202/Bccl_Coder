import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function AccordionSection({ title, defaultOpen = false, children, count }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-ink-200/70 bg-white/60 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          "w-full flex items-center justify-between px-4 py-3 text-left",
          "hover:bg-ink-50/70 transition"
        )}
        aria-expanded={open}
      >
        <span className="font-medium text-ink-800">
          {title}
          {typeof count === "number" && (
            <span className="ml-2 text-xs text-ink-400 mono">({count})</span>
          )}
        </span>
        <span className={clsx("text-ink-400 transition", open && "rotate-90")}>›</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-ink-200/60">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
