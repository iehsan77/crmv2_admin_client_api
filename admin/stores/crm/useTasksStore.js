"use client";

import { getKeysObject } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";

import {
  TASKS_AVAILABLE_VIEWS,
  TASKS_INITIAL_VIEWS,
  TASKS_AVAILABLE_FILTERS,
  TASKS_INITIAL_FILTERS
} from "@/constants/crm_constants";

import createModuleStore from "@/stores/factories/createModuleStore";
import createFiltersStore from "@/stores/factories/createFiltersStore";
import createViewTabsStore from "@/stores/factories/createViewTabsStore";
import createAssociationStore from "@/stores/factories/createAssociationStore";
import createModuleDetailTabsStore from "../factories/createModuleDetailTabsStore";

// 🔹 Filters Store
export const useTasksFiltersStore = createFiltersStore(
  getKeysObject(TASKS_AVAILABLE_FILTERS)
);

// 🔹 View Details Page Tabs Store
export const useTasksTabsStore = createModuleDetailTabsStore({
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
export const useTasksAssociationStore = createAssociationStore();

// 🔹 View Tabs Store
export const useTasksViewTabsStore = createViewTabsStore({
  availableTabs: TASKS_AVAILABLE_VIEWS,
  initialTabs: TASKS_INITIAL_VIEWS,
  defaultTab: "all_tasks",
  maxTabs: 6,
});

// 🔹 Main Tasks Store
const { tasks } = crm_endpoints?.crm || {};

const useTasksStore = createModuleStore({
  moduleName: "Task",
  endpoints: {
    get: tasks?.get,
    save: tasks?.save,
    getByStatus:tasks?.getByStatus,
    delete: (id) => tasks?.delete(id),
    getDetails: (id) => tasks?.getDetails(id),
    restore: (id) => tasks?.restore(id),
    favorite: (id, fav) => tasks?.favorite(id, fav),
  },
  filtersStore: useTasksFiltersStore,
  viewTabsStore: useTasksViewTabsStore,
});

export default useTasksStore;
