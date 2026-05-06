import { lazy } from "react";

export const SIDEBAR = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard" },
      { to: "/comparison", label: "Experiment Comparison" },
    ],
  },
  {
    title: "ROI & Voxels",
    items: [
      { to: "/roi", label: "ROI Performance" },
      { to: "/voxels", label: "Voxel Mapping" },
      { to: "/noise-ceiling", label: "Noise Ceiling Analysis" },
    ],
  },
  {
    title: "Speaker Analysis",
    items: [
      { to: "/speaker", label: "Speaker Category Analysis" },
      { to: "/bootstrap", label: "Bootstrap ROI Membership" },
    ],
  },
  {
    title: "Diagnostics",
    items: [
      { to: "/qc", label: "Quality Control" },
      { to: "/sweep", label: "Hyperparameter Sweep" },
    ],
  },
  {
    title: "Assets",
    items: [{ to: "/figures", label: "Figure Gallery" }],
  },
  {
    title: "Brain Maps",
    items: [{ to: "/brain-map", label: "Brain Activation Map" }],
  },
];

export const PAGES = {
  Dashboard: lazy(() => import("./pages/Dashboard.jsx")),
  ExperimentComparison: lazy(() => import("./pages/ExperimentComparison.jsx")),
  RoiPerformance: lazy(() => import("./pages/RoiPerformance.jsx")),
  VoxelMapping: lazy(() => import("./pages/VoxelMapping.jsx")),
  NoiseCeiling: lazy(() => import("./pages/NoiseCeiling.jsx")),
  SpeakerCategory: lazy(() => import("./pages/SpeakerCategory.jsx")),
  BootstrapMembership: lazy(() => import("./pages/BootstrapMembership.jsx")),
  QualityControl: lazy(() => import("./pages/QualityControl.jsx")),
  HyperparameterSweep: lazy(() => import("./pages/HyperparameterSweep.jsx")),
  FigureGalleryPage: lazy(() => import("./pages/FigureGalleryPage.jsx")),
  BrainActivationMap: lazy(() => import("./pages/BrainActivationMap.jsx")),
};
