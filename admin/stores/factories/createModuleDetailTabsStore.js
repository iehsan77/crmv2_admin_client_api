"use client";

import { create } from "zustand";

/**
 * Factory to manage main & nested subtabs for module detail pages
 *
 * @param {Object} config
 * @param {Array<{ key: string, title: string, subTabs?: Array<{ key: string, title: string }> }>} [config.tabs]
 * @param {string} [config.defaultTab="tab1"]
 * @param {string|null} [config.defaultSubTab=null]
 */
export default function createModuleDetailTabsStore({
  tabs = [
    {
      key: "tab1",
      title: "Overview",
    },
    {
      key: "tab2",
      title: "Activity",
      subTabs: [
        { key: "subTab1", title: "Timeline" },
        { key: "subTab2", title: "Notes" },
        { key: "subTab3", title: "Attachments" },
      ],
    },
  ],
  defaultTab = "tab1",
  defaultSubTab = "subTab1",
} = {}) {
  return create((set, get) => ({
    // ✅ Tabs
    tabs,
    selectedTab: defaultTab,
    setSelectedTab: (tabKey) => set({ selectedTab: tabKey }),

    // ✅ SubTabs (dynamic based on selected tab)
    selectedSubTab: defaultSubTab,
    setSelectedSubTab: (subTabKey) => set({ selectedSubTab: subTabKey }),

    // ✅ Get current tab’s subTabs easily
    getActiveSubTabs: () => {
      const { tabs, selectedTab } = get();
      return tabs.find((t) => t.key === selectedTab)?.subTabs || [];
    },

    // ✅ Reset helpers
    resetMainTabs: () => set({ selectedTab: defaultTab }),
    resetSubTabs: () => set({ selectedSubTab: defaultSubTab }),
    resetAllTabs: () =>
      set({
        selectedTab: defaultTab,
        selectedSubTab: defaultSubTab,
      }),
  }));
}
