"use client";

import { getKeysObject } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";

import {
  CALLS_AVAILABLE_VIEWS,
  CALLS_INITIAL_VIEWS,
  CALLS_AVAILABLE_FILTERS,
  CALLS_INITIAL_FILTERS
} from "@/constants/crm_constants";

import createModuleStore from "@/stores/factories/createModuleStore";
import createFiltersStore from "@/stores/factories/createFiltersStore";
import createViewTabsStore from "@/stores/factories/createViewTabsStore";
import createAssociationStore from "@/stores/factories/createAssociationStore";
import createModuleDetailTabsStore from "../factories/createModuleDetailTabsStore";

// 🔹 Filters Store
export const useCallsFiltersStore = createFiltersStore(
  getKeysObject(CALLS_AVAILABLE_FILTERS)
);

// 🔹 View Tabs Store
export const useCallsViewTabsStore = createViewTabsStore({
  availableTabs: CALLS_AVAILABLE_VIEWS,
  initialTabs: CALLS_INITIAL_VIEWS,
  defaultTab: "all_calls",
  maxTabs: 6,
});

// 🔹 View Details Page Tabs Store
export const useCallsTabsStore = createModuleDetailTabsStore({
  tabs: [
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
        { key: "subTab3", title: "Tasks" },
        { key: "subTab4", title: "Meetings" },
        { key: "subTab5", title: "Calls" },
      ],
    },
  ],
  defaultTab: "tab1",
  defaultSubTab: "subTab1",
});

// 🔹 Association Store
export const useCallsAssociationStore = createAssociationStore();

// 🔹 Main Calls Store
const { calls } = crm_endpoints?.crm || {};

const useCallsStore = createModuleStore({
  moduleName: "Call",
  endpoints: {
    get: calls?.get,
    save: calls?.save,
    getByStatus: calls?.getByStatus,
    delete: (id) => calls?.delete(id),
    getDetails: (id) => calls?.getDetails(id),
    restore: (id) => calls?.restore(id),
    favorite: (id, fav) => calls?.favorite(id, fav),
  },
  filtersStore: useCallsFiltersStore,
  viewTabsStore: useCallsViewTabsStore,

  // ✅ Add dynamic methods & state using function form
  extraMethods: (set, get) => ({
    today_date: 0,
    setTodayDate: (v) => set({ today_date: v }),
  }),

  // ✅ Optional: if you want to always include parent_id in every fetch payload
  extraPayload: (get) => ({
    today_date: get().today_date || 0,
  }),

});

export default useCallsStore;


