import { lazy } from "react";

export const SIDEBAR = [
  {
    title: "Core Views",
    items: [
      { to: "/", label: "Overview" },
      { to: "/comparison", label: "Experiment Comparison" },
      { to: "/noise-ceiling", label: "Noise Ceiling Analysis" },
      { to: "/brain-map", label: "Model Explorer" },
    ],
  },
  {
    title: "Assets",
    items: [
      { to: "/figures", label: "Figure Gallery" },
      { to: "/presentation", label: "Presentation Deck" },
    ],
  },
];

export const PAGES = {
  Dashboard: lazy(() => import("./pages/Dashboard.jsx")),
  ExperimentComparison: lazy(() => import("./pages/ExperimentComparison.jsx")),
  NoiseCeiling: lazy(() => import("./pages/NoiseCeiling.jsx")),
  FigureGalleryPage: lazy(() => import("./pages/FigureGalleryPage.jsx")),
  PresentationPage: lazy(() => import("./pages/PresentationPage.jsx")),
  BrainActivationMap: lazy(() => import("./pages/BrainActivationMap.jsx")),
};
