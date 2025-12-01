import { create } from "zustand";

// ---------- Overview Store ----------
const useOverviewStore = create((set) => ({
  viewMode: "grid",
  setViewMode: (mode) => set(() => ({ viewMode: mode })),
}));

export default useOverviewStore;
