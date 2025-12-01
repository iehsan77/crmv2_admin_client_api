"use client";
import { create } from "zustand";

// ---------- Views Tabs Store Factory ----------
const createViewsTabsStore = ({
  initialTabs = [],
  defaultTab = "",
  maxTabs = 6,
} = {}) =>
  create((set, get) => ({
    tabs: initialTabs,
    defaultTab,
    activeTab: defaultTab || null,
    maxTabs,

    // setters
    setTabs: (tabs) => set({ tabs }),
    setDefaultTab: (tab) => set({ defaultTab: tab }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setMaxTabs: (qty) => set({ maxTabs: qty }),

    // add tab
    addTab: (tab) =>
      set((state) => {
        if (state.tabs.some((t) => t.value === tab.value)) {
          return { activeTab: tab.value }; // activate existing
        }
        if (state.tabs.length >= state.maxTabs) {
          console.warn(`Max ${state.maxTabs} tabs allowed`);
          return {};
        }
        return { tabs: [...state.tabs, tab], activeTab: tab.value };
      }),

    // remove tab
    removeTab: (value) =>
      set((state) => {
        if (value === state.defaultTab) return {}; // cannot remove default tab

        const updatedTabs = state.tabs.filter((t) => t.value !== value);
        const newActive =
          state.activeTab === value
            ? updatedTabs[0]?.value || null
            : state.activeTab;

        return { tabs: updatedTabs, activeTab: newActive };
      }),

    // reset all tabs
    resetTabs: () =>
      set(() => ({
        tabs: defaultTab ? [{ value: defaultTab }] : [],
        activeTab: defaultTab || null,
      })),
  }));

export default createViewsTabsStore;
