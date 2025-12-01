"use client";

import { getKeysObject } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";

import {
  MEETINGS_AVAILABLE_VIEWS,
  MEETINGS_INITIAL_VIEWS,
  MEETINGS_AVAILABLE_FILTERS,
  MEETINGS_INITIAL_FILTERS
} from "@/constants/crm_constants";

import createModuleStore from "@/stores/factories/createModuleStore";
import createFiltersStore from "@/stores/factories/createFiltersStore";
import createViewTabsStore from "@/stores/factories/createViewTabsStore";
import createAssociationStore from "@/stores/factories/createAssociationStore";
import createModuleDetailTabsStore from "../factories/createModuleDetailTabsStore";

// 🔹 Filters Store
export const useMeetingsFiltersStore = createFiltersStore(
  getKeysObject(MEETINGS_AVAILABLE_FILTERS)
);

// 🔹 View Tabs Store
export const useMeetingsViewTabsStore = createViewTabsStore({
  availableTabs: MEETINGS_AVAILABLE_VIEWS,
  initialTabs: MEETINGS_INITIAL_VIEWS,
  defaultTab: "all_meetings",
  maxTabs: 6,
});

// 🔹 View Details Page Tabs Store
export const useMeetingsTabsStore = createModuleDetailTabsStore({
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
export const useMeetingsAssociationStore = createAssociationStore();

// 🔹 Main Meetings Store
const { meetings } = crm_endpoints?.crm || {};

const useMeetingsStore = createModuleStore({
  moduleName: "Meeting",
  endpoints: {
    get: meetings?.get,
    save: meetings?.save,
    getByStatus:meetings?.getByStatus,
    delete: (id) => meetings?.delete(id),
    getDetails: (id) => meetings?.getDetails(id),
    restore: (id) => meetings?.restore(id),
    favorite: (id, fav) => meetings?.favorite(id, fav),
  },
  filtersStore: useMeetingsFiltersStore,
  viewTabsStore: useMeetingsViewTabsStore,
});

export default useMeetingsStore;
