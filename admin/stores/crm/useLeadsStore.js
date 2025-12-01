"use client";

import { getKeysObject } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import {
  LEADS_AVAILABLE_VIEWS,
  LEADS_INITIAL_VIEWS,
  LEADS_AVAILABLE_FILTERS,
} from "@/constants/crm_constants";

import createModuleStore from "@/stores/factories/createModuleStore";
import createFiltersStore from "@/stores/factories/createFiltersStore";
import createViewTabsStore from "@/stores/factories/createViewTabsStore";
import createAssociationStore from "@/stores/factories/createAssociationStore";
import createModuleDetailTabsStore from "../factories/createModuleDetailTabsStore";

// 🔹 Filters Store
export const useLeadsFiltersStore = createFiltersStore(
  getKeysObject(LEADS_AVAILABLE_FILTERS)
);

// 🔹 View Tabs Store
export const useLeadsViewTabsStore = createViewTabsStore({
  availableTabs: LEADS_AVAILABLE_VIEWS,
  initialTabs: LEADS_INITIAL_VIEWS,
  defaultTab: "all_leads",
  maxTabs: 6,
});

// 🔹 View Details Page Tabs Store
export const useLeadsTabsStore = createModuleDetailTabsStore({
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
export const useLeadsAssociationStore = createAssociationStore();

// 🔹 Main Leads Store
const { leads } = crm_endpoints?.crm || {};
const useLeadsStore = createModuleStore({
  moduleName: "Lead",
  endpoints: {
    get: leads?.get,
    save: leads?.save,
    getByStatus:leads?.getByStatus,
    delete: (id) => leads?.delete(id),
    getDetails: (id) => leads?.getDetails(id),
    restore: (id) => leads?.restore(id),
    favorite: (id, fav) => leads?.favorite(id, fav),
  },
  filtersStore: useLeadsFiltersStore,
  viewTabsStore: useLeadsViewTabsStore,
});

export default useLeadsStore;
