"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { common_endpoints } from "@/utils/common_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import { ChevronDown, LayoutGrid, LayoutList, Table } from "lucide-react";

const toDate = new Date();
const fromDate = new Date();
fromDate.setDate(toDate.getDate() - 7);


const useCommonStore = create(
  //persist(
  (set, get) => ({
    countries: [{ value: "1", label: "UAE" }],
    countriesLoading: false,
    states: [
      { value: "Abu Dhabi", label: "Abu Dhabi" },
      { value: "Ajman", label: "Ajman" },
      { value: "Dubai", label: "Dubai" },
      { value: "Fujairah", label: "Fujairah" },
      { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
      { value: "Sharjah", label: "Sharjah" },
      { value: "Umm Al Quwain", label: "Umm Al Quwain" },
    ],
    cities: [],
    citiesLoading: false,
    error: null,

    viewOptions: [
      { value: "list", label: "List", icon: LayoutList },
      { value: "table", label: "Table", icon: Table },
      { value: "grid", label: "Grid", icon: LayoutGrid },
    ],

    // to set Dates - starting
    range: { from: fromDate, to: toDate },
    setRange: (dates) => set({ range: dates }),
    // to set Dates - starting

    // to set Dates - starting
    viewMode: "list",
    setViewMode: (mode) => set({ viewMode: mode }),
    // to set Dates - starting

    fetchCountries: async (body = {}) => {
      if (get().countries?.length>1) return;
      set({ countriesLoading: true, error: null });

      try {
        const response = await GET(common_endpoints?.getCountries);

        console.log("fetch countries response 54")
        console.log(response)

        if (response?.status === 200) {
          set({
            countries: response?.data,
            countriesLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        set({
          error: "Failed to fetch body types",
          countriesLoading: false,
        });
      }
    },

    fetchCities: async () => {
      if (get().cities?.length) return;
      set({ citiesLoading: true, error: null });
      try {
        const response = await GET(common_endpoints?.getCities);

        if (response?.status === 200) {
          set({
            cities: response?.data,
            citiesLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        set({
          error: "Failed to fetch body types",
          citiesLoading: false,
        });
      }
    },
    getCitiesByCountryId: (id) => {
      return get().cities.filter((r) => Number(r?.country_id) === Number(id));
    },
  }),
  {
    name: "common-store",
  }
  //)
);

export default useCommonStore;
