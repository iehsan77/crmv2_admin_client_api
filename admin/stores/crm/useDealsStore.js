"use client";

import { getKeysObject } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";

import {
  DEALS_AVAILABLE_VIEWS,
  DEALS_INITIAL_VIEWS,
  DEALS_AVAILABLE_FILTERS,
} from "@/constants/crm_constants";

import createModuleStore from "@/stores/factories/createModuleStore";
import createFiltersStore from "@/stores/factories/createFiltersStore";
import createViewTabsStore from "@/stores/factories/createViewTabsStore";
import createAssociationStore from "@/stores/factories/createAssociationStore";
import createModuleDetailTabsStore from "../factories/createModuleDetailTabsStore";

// 🔹 Filters Store
export const useDealsFiltersStore = createFiltersStore(
  getKeysObject(DEALS_AVAILABLE_FILTERS)
);

// 🔹 View Tabs Store
export const useDealsViewTabsStore = createViewTabsStore({
  availableTabs: DEALS_AVAILABLE_VIEWS,
  initialTabs: DEALS_INITIAL_VIEWS,
  defaultTab: "all_deals",
  maxTabs: 6,
});

// 🔹 View Details Page Tabs Store
export const useDealsTabsStore = createModuleDetailTabsStore({
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
export const useDealsAssociationStore = createAssociationStore();

// 🔹 Main Deals Store
const { deals } = crm_endpoints?.crm || {};

const useDealsStore = createModuleStore({
  moduleName: "Deal",
  endpoints: {
    get: deals?.get,
    save: deals?.save,
    getByStatus: deals?.getByStatus,
    delete: (id) => deals?.delete(id),
    getDetails: (id) => deals?.getDetails(id),
    restore: (id) => deals?.restore(id),
    favorite: (id, fav) => deals?.favorite(id, fav),
  },

  filtersStore: useDealsFiltersStore,
  viewTabsStore: useDealsViewTabsStore,
  
  // ✅ Add dynamic methods & state using function form
  extraMethods: (set, get) => ({
    account_id: 0,
    setAccountId: (id) => set({ account_id: id }),
  }),

  // ✅ Optional: if you want to always include account_id in every fetch payload
  extraPayload: (get) => ({
    account_id: get().account_id || 0,
  }),

});

export default useDealsStore;
