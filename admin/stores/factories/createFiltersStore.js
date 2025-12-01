"use client";
import { create } from "zustand";

// This is a factory, NOT a hook
const createFiltersStore = (initialValues = {}) =>
  create((set, get) => ({
    filters: [],
    maxFilters: 5,
    activeFilter: null,
    values: initialValues,

    resetFilters: () =>
      set((state) => ({
        // Keep filters and activeFilter as they are
        filters: state.filters,
        activeFilter: state.activeFilter,
        // Reset only values to initial defaults
        values: initialValues,
      })),

    setFilters: (filters) => set({ filters }),
    setMaxFilters: (qty) => set({ maxFilters: qty }),
    setActiveFilter: (filter) => set({ activeFilter: filter }),
    setValues: (values) => set({ values }),

    addFilter: (filter) =>
      set((state) => {
        if (state.filters.some((f) => f.value === filter.value)) {
          return { activeFilter: filter.value };
        }
        if (state.filters.length >= state.maxFilters) {
          console.warn(`Max ${state.maxFilters} filters allowed`);
          return {};
        }
        return {
          filters: [...state.filters, filter],
          activeFilter: filter.value,
        };
      }),

    removeFilter: (value) =>
      set((state) => {
        const updatedFilters = state.filters.filter((f) => f.value !== value);
        const { [value]: _, ...updatedValues } = state.values;

        const newActive =
          state.activeFilter === value
            ? updatedFilters[0]?.value || null
            : state.activeFilter;

        return {
          filters: updatedFilters,
          activeFilter: newActive,
          values: updatedValues,
        };
      }),

    updateValue: (key, val) =>
      set((state) => ({
        values: { ...state.values, [key]: val },
      })),

    getPayload: () => get().values,
    getMaxFilters: () => get().maxFilters,
  }));

export default createFiltersStore;
