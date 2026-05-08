import { lazy } from "react";

export const SIDEBAR = [
  {
    title: "Core Views",
    items: [
      { to: "/", label: "Overview" },
      { to: "/brain-map", label: "Model Explorer" },
    ],
  },
];

export const PAGES = {
  Dashboard: lazy(() => import("./pages/Dashboard.jsx")),
  BrainActivationMap: lazy(() => import("./pages/BrainActivationMap.jsx")),
};
