"use client";

import { getKeysObject } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";

import {
  CONTACTS_AVAILABLE_VIEWS,
  CONTACTS_INITIAL_VIEWS,
  CONTACTS_AVAILABLE_FILTERS,
} from "@/constants/crm_constants";

import createModuleStore from "@/stores/factories/createModuleStore";
import createFiltersStore from "@/stores/factories/createFiltersStore";
import createViewTabsStore from "@/stores/factories/createViewTabsStore";
import createAssociationStore from "@/stores/factories/createAssociationStore";
import createModuleDetailTabsStore from "../factories/createModuleDetailTabsStore";

// 🔹 Filters Store
export const useContactsFiltersStore = createFiltersStore(
  getKeysObject(CONTACTS_AVAILABLE_FILTERS)
);

// 🔹 View Tabs Store
export const useContactsViewTabsStore = createViewTabsStore({
  availableTabs: CONTACTS_AVAILABLE_VIEWS,
  initialTabs: CONTACTS_INITIAL_VIEWS,
  defaultTab: "all_contacts",
  maxTabs: 6,
});


// 🔹 View Details Page Tabs Store
export const useContactsTabsStore = createModuleDetailTabsStore({
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
export const useContactsAssociationStore = createAssociationStore();

// 🔹 Main Contacts Store
const { contacts } = crm_endpoints?.crm || {};

const useContactsStore = createModuleStore({
  moduleName: "Contact",
  endpoints: {
    get: contacts?.get,
    save: contacts?.save,
    getByStatus: contacts?.getByStatus,
    delete: (id) => contacts?.delete(id),
    getDetails: (id) => contacts?.getDetails(id),
    restore: (id) => contacts?.restore(id),
    favorite: (id, fav) => contacts?.favorite(id, fav),
  },

  filtersStore: useContactsFiltersStore,
  viewTabsStore: useContactsViewTabsStore,

  // ✅ Add dynamic methods & state using function form
  //extraMethods: (set, get) => ({ account_id: 0, setAccountId: (id) => set({ account_id: id }), }),

  // ✅ Optional: if you want to always include account_id in every fetch payload
  //extraPayload: (get) => ({ account_id: get().account_id || 0, }),

});

export default useContactsStore;
