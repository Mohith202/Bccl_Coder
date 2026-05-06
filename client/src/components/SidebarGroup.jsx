import { NavLink } from "react-router-dom";
import clsx from "clsx";

export default function SidebarGroup({ title, items, search }) {
  return (
    <div className="mb-5">
      <div className="px-3 mb-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-400 font-medium">
        {title}
      </div>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={{ pathname: it.to, search }}
              className={({ isActive }) =>
                clsx(
                  "block px-3 py-1.5 rounded-md text-sm transition",
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "text-ink-600 hover:bg-ink-100/70 hover:text-ink-900"
                )
              }
            >
              {it.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
