"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
// import { endpoints } from "@/utils/endpoints";
// import { GET, POST_JSON } from "@/actions/actions";
// import handleStatusCode from "@/helpers/handleStatusCode";

const MAX_FILTERS = 5;

const useFiltersStore = create((set, get) => ({
  filters: [],
  activeFilter: null,
  values: {
    brand: [],
    model: [],
    variant: [],
    status: null,
    transmission_type: null,
    last_activity: null,
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

export { useFiltersStore };

const useCustomerBookingsStore = create((set, get) => ({
  bookings: [],
  booking: [],
  loading: false,
  error: null,

  setCustomerBookings: (records) =>
    set((state) => ({
      customer: {
        ...state.customer,
        bookings: records,
      },
    })),

}));

export default useCustomerBookingsStore;
