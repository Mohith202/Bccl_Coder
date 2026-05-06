import { create } from "zustand";

// minimal local store — using URL params is the source of truth for selection.
export const useUI = create((set) => ({
  selectedRoi: null,
  setSelectedRoi: (v) => set({ selectedRoi: v }),
}));
