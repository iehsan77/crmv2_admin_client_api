"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const MAX_TABS = 5;
const MAX_FILTERS = 5;

const useAffiliatesStore = create(
  //persist(
  (set, get) => ({
    affiliates: [],
    affiliatesLoading: false,
    error: null,
    filteredAffiliates: [],

    page: 1,
    pages: 0,
    limit: 20,

    setPage: (n) => set({ page: n }),

    setAffiliates: (records) => set({ affiliates: records }),

    setFilteredAffiliates: async (body = {}) => {
      set({ affiliatesLoading: true, error: null });

      try {
        const response = await POST(
          rentify_endpoints?.rentify?.affiliates?.get,
          body
        );

        if (response?.status === 200) {
          set({
            page:1,
            filteredAffiliates: response?.data,
            affiliatesLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        set({
          error: "Failed to fetch vehicles",
          affiliatesLoading: false,
        });
      }
    },

    // Fetch all affiliates (once)
    fetchAffiliates: async (body = {}) => {
      //if (get().affiliates?.length) return;
      set({ affiliatesLoading: true, error: null });

      try {
        const response = await POST(
          rentify_endpoints?.rentify?.affiliates?.get,
          body
        );

        console.log("affiliates response")
        console.log(response)


        if (response?.status === 200) {
          set({
            page:1,
            affiliates: response?.data,
            affiliatesLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        set({
          error: "Failed to fetch vehicles",
          affiliatesLoading: false,
        });
      }
    },

    // Get single record
    getAffiliate: (id) => get().affiliates.find((r) => r?.id === id) || null,

    // Add new affiliate
    /*    
    saveAffiliate: (data) => {
      try {
        // ======= API CALL (commented for now) =======
        // await POST_JSON(endpoints?.affiliates?.add, data);

        set((state) => ({
          affiliates: [...state.affiliates, data],
        }));
      } catch (err) {
        console.log(err);
      }
    },
*/
    saveAffiliate: (data) => {
      try {
        // ======= API CALL (commented for now) =======
        // await POST_JSON(endpoints?.affiliates?.add, data);

        set((state) => ({
          affiliates: [data, ...state.affiliates], // prepend instead of append
        }));
      } catch (err) {
        console.log(err);
      }
    },

    // Update affiliate
    updateAffiliate: (data) => {
      try {
        // ======= API CALL (commented for now) =======
        // await POST_JSON(endpoints?.affiliates?.update(data.id), data);

        set((state) => ({
          affiliates: state.affiliates.map((r) =>
            r?.id === data?.id ? { ...r, ...data } : r
          ),
        }));
      } catch (err) {
        console.log(err);
      }
    },

    updateAffiliateStatus: (id, status) => {
      try {
        // ======= API CALL (commented for now) =======
        // await POST_JSON(endpoints?.affiliates?.updateStatus(id), { status });

        set((state) => ({
          affiliates: state.affiliates.map((r) =>
            r?.id === id ? { ...r, active: status } : r
          ),
        }));
      } catch (err) {
        console.log(err);
      }
    },

    // Delete affiliate
    deleteAffiliate: async (id) => {
      try {
        // ======= API CALL (commented for now) =======
        // const response = await GET(endpoints?.affiliates?.delete(id));
        // handleStatusCode(response);
        // if (response?.status !== 200) {
        //   throw new Error(response?.message);
        // }

        const record = get().getAffiliate(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          affiliates: state.affiliates.filter((r) => r?.id !== id),
          affiliatesLoading: false,
          error: null,
        }));
      } catch (err) {
        console.log(err);
      }
    },
  }),
  {
    name: "affiliates-store", // localStorage key
  }
  //)
);

export default useAffiliatesStore;

const useViewTabsStore = create((set, get) => ({
  tabs: [],
  activeTab: null,

  setTabs: (tabs) => set({ tabs }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addTab: (tab) => {
    const { tabs } = get();
    if (tabs.find((t) => t.value === tab.value)) {
      set({ activeTab: tab.value });
      return true;
    }
    if (tabs.length >= MAX_TABS) {
      console.warn(`Max ${MAX_TABS} tabs allowed`);
      return false;
    }
    set({ tabs: [...tabs, tab], activeTab: tab.value });
    return true;
  },

  removeTab: (value) => {
    if (value !== "all_affiliates") {
      const { tabs, activeTab } = get();
      const updatedTabs = tabs.filter((t) => t.value !== value);
      let newActive = activeTab;
      if (activeTab === value && updatedTabs.length > 0) {
        newActive = updatedTabs[0].value;
      }
      set({ tabs: updatedTabs, activeTab: newActive });
    }
  },

  getMaxTabs: () => MAX_TABS,
}));

const useFiltersStore = create((set, get) => ({
  filters: [],
  activeFilter: null,
  values: {
    keyword: "",
    vehicles: "",
    active: "",
  },

  setFilters: (filters) => set({ filters }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  addFilter: (filter) => {
    const { filters } = get();
    if (filters.find((f) => f.value === filter.value)) {
      set({ activeFilter: filter.value });
      return true;
    }
    if (filters.length >= MAX_FILTERS) {
      console.warn(`Max ${MAX_FILTERS} filters allowed`);
      return false;
    }
    set({ filters: [...filters, filter], activeFilter: filter.value });
    return true;
  },

  removeFilter: (value) => {
    const { filters, activeFilter, values } = get();
    const updatedFilters = filters.filter((f) => f.value !== value);

    // also clear value from payload
    const updatedValues = {
      ...values,
      [value]: Array.isArray(values[value]) ? [] : null,
    };

    let newActive = activeFilter;
    if (activeFilter === value && updatedFilters.length > 0) {
      newActive = updatedFilters[0].value;
    }
    set({
      filters: updatedFilters,
      activeFilter: newActive,
      values: updatedValues,
    });
  },

  updateValue: (key, val) => {
    const { values } = get();
    set({ values: { ...values, [key]: val } });
  },

  getPayload: () => get().values,

  getMaxFilters: () => MAX_FILTERS,
}));

export { useViewTabsStore, useFiltersStore };
