"use client";

import { getKeysObject } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";

import {
  ACCOUNTS_AVAILABLE_VIEWS,
  ACCOUNTS_INITIAL_VIEWS,
  ACCOUNTS_AVAILABLE_FILTERS,
} from "@/constants/crm_constants";

import createModuleStore from "@/stores/factories/createModuleStore";
import createFiltersStore from "@/stores/factories/createFiltersStore";
import createViewTabsStore from "@/stores/factories/createViewTabsStore";
import createAssociationStore from "@/stores/factories/createAssociationStore";
import createModuleDetailTabsStore from "@/stores/factories/createModuleDetailTabsStore";

// 🔹 Filters Store
export const useAccountsFiltersStore = createFiltersStore(
  getKeysObject(ACCOUNTS_AVAILABLE_FILTERS)
);

// 🔹 View Tabs Store
export const useAccountsViewTabsStore = createViewTabsStore({
  availableTabs: ACCOUNTS_AVAILABLE_VIEWS,
  initialTabs: ACCOUNTS_INITIAL_VIEWS,
  defaultTab: "all_accounts",
  maxTabs: 6,
});

// 🔹 View Details Page Tabs Store
export const useAccountsTabsStore = createModuleDetailTabsStore({
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
export const useAccountsAssociationStore = createAssociationStore();

// 🔹 Main Accounts Store
const { accounts } = crm_endpoints?.crm || {};
const useAccountsStore = createModuleStore({
  moduleName: "Accounts",

  endpoints: {
    get: accounts?.get,
    save: accounts?.save,
    getByStatus: accounts?.getByStatus,
    delete: (id) => accounts?.delete(id),
    getDetails: (id) => accounts?.getDetails(id),
    restore: (id) => accounts?.restore(id),
    favorite: (id, fav) => accounts?.favorite(id, fav),
  },

  filtersStore: useAccountsFiltersStore,
  viewTabsStore: useAccountsViewTabsStore,

  // ✅ Add dynamic methods & state using function form
  extraMethods: (set, get) => ({
    parent_id: 0,
    setParentId: (id) => set({ parent_id: id }),
  }),

  // ✅ Optional: if you want to always include parent_id in every fetch payload
  extraPayload: (get) => ({
    parent_id: get().parent_id || 0,
  }),
});

export default useAccountsStore;
