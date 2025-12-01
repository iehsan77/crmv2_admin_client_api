import { create } from "zustand";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const MAX_TABS = 6;
const MAX_FILTERS = 5;

// ---------- Tabs Store ----------
export const useVehiclesViewTabsStore = create((set, get) => ({
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
    if (value !== "all_cars") {
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

// ---------- Filters Store ----------
export const useVehiclesFiltersStore = create((set, get) => ({
  filters: [],
  activeFilter: null,
  values: {
    /*
    vehicle: [],
    model: [],
    variant: [],
    status: null,
    transmission_type: null,
    last_activity: null,
    */
    vehicle_id: "",
    title: "",
    rent_price: "",
    brand_id: "",
    model_id: "",
    variant_id: "",
    status_id: "",
    last_activity: "",
    transmission_type_id: "",
    seats: "",
    fuel_type_id: "",
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

// ---------- Vehicles Store ----------
const useVehiclesStore = create((set, get) => ({
  vehicles: [],
  vehicle: [],
  vehiclesLoading: false,
  error: null,

  filteredVehicles: [],

  page: 1,
  pages: 0,
  limit: 20,

  setPage: (n) => set({ page: n }),

  setVehicles: (records) => set({ vehicles: records }),

  setFilteredVehicles: async (body = {}) => {
    set({ vehiclesLoading: true, error: null });

    try {
      const response = await POST(
        rentify_endpoints?.rentify?.vehicles?.get,
        body
      );

      if (response?.status === 200) {
        set({
          filteredVehicles: response?.data,
          vehiclesLoading: false,
        });
      } else {
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      set({
        error: "Failed to fetch vehicles",
        vehiclesLoading: false,
      });
    }
  },

  fetchVehicles: async (body = {}, force = false) => {
    /*
    if (!force) {
      if (get().vehicles?.length) return;
      }
      */
     set({ vehiclesLoading: true, error: null });
    try {
      const response = await POST(
        rentify_endpoints?.rentify?.vehicles?.get,
        body
      );

      console.log("response 168");
      console.log(response);

      if (response?.status === 200) {
        set({
          vehicles: response?.data,
          vehiclesLoading: false,
        });
      } else {
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      set({
        error: "Failed to fetch vehicles",
        vehiclesLoading: false,
      });
    }
  },

  getVehicle: (id) => get().vehicles.find((r) => r?.id === id) || null,

  saveVehicle: (record) => {
    try {
      set((state) => ({
        vehicles: [record, ...state.vehicles],
      }));
    } catch (err) {
      console.error(err);
    }
  },

  /*
  updateVehicle: (record) => {
    try {
      set((state) => ({
        vehicles: state.vehicles.map((r) =>
          r?.id === record?.id ? { ...r, ...record } : r
        ),
      }));
    } catch (err) {
      console.log(err);
    }
  },
  */
  updateVehicle: (record) => {
    try {
      if (!record?.id) return;

      set((state) => {
        const index = state.vehicles.findIndex((v) => v.id === record.id);
        if (index === -1) return state; // no change

        const vehicles = [...state.vehicles];
        vehicles[index] = { ...vehicles[index], ...record };

        return { vehicles };
      });
    } catch (err) {
      console.error("updateVehicle error:", err);
    }
  },

  deleteVehicle: async (id) => {
    try {
      const record = get().getVehicle(id);
      if (!record) throw new Error("Record not found");

      set((state) => ({
        vehicles: state.vehicles.filter((r) => r?.id !== id),
        vehiclesLoading: false,
        error: null,
      }));
    } catch (err) {
      console.log(err);
    }
  },
}));

export default useVehiclesStore;
