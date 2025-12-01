"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useBrandsStore = create(
  //  persist(
  (set, get) => ({
    brands: [],
    brandsForDropdown: [],
    brand: [],
    brandsLoading: false,
    error: null,

    filteredBrands: [],
    setFilteredBrands: async (body = {}) => {
      set({ brandsLoading: true, error: null });

      try {
        const response = await POST(
          rentify_endpoints?.rentify?.brands?.get,
          body
        );

        if (response?.status === 200) {
          set({
            filteredBrands: response?.data,
            brandsLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        console.log(err);
        set({
          error: "Failed to fetch body types",
          brandsLoading: false,
        });
      }
    },

    fetchBrands: async (body = {}) => {
      //if (get().brands?.length) return;
      set({ brandsLoading: true, error: null });
      //alert("called")
      try {
        const response = await POST(
          rentify_endpoints?.rentify?.brands?.get,
          body
        );
        //console.log("brand body 54"); console.log(body);
        //console.log("brand response 54"); console.log(response);
        if (response?.status === 200) {
          set({
            brands: response?.data,
            brandsLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        console.log(err);
        set({
          error: "Failed to fetch body types",
          brandsLoading: false,
        });
      }
    },

    fetchBrandsForDropdown: async () => {
      set({ brandsLoading: true, error: null });

      try {
        const response = await GET(rentify_endpoints?.rentify?.brands?.getForDropdown);

//console.log("response 82"); console.log(response); return false;


        if (response?.status !== 200) {
          throw new Error(response?.message || "Fetch failed");
        }

        const data = Array.isArray(response?.data) ? response.data : [];

        const filtered = data.map(({ brand_id, title }) => ({
            value: String(brand_id),
            label: String(title),
          }));

        set({
          brandsForDropdown: filtered,
          brandsLoading: false,
        });
      } catch (err) {
        console.log(err);
        set({
          error: "Failed to fetch brands",
          brandsLoading: false,
          brandsForDropdown: [], // ensure reset on failure
        });
      }
    },

    getBrand: (id) => get().brands.find((r) => r?.id === id) || null,

    //getUsedBrands: () => get().brands.filter((r) => r?.used_id) || [],

    getUsedBrands: () =>
      get().brands.filter((r) => {
        return r?.is_used;
      }) || [],

    saveBrand: (record) => {
      try {
        set((state) => ({
          brands: [record, ...state.brands], // add at start
        }));
      } catch (err) {
        console.error(err);
      }
    },

    updateBrand: (record) => {
      console.log(record, "brand update record");
      try {
        set((state) => ({
          brands: state.brands.map((r) =>
            r?.id === record?.id ? { ...r, ...record } : r
          ),
        }));
      } catch (err) {
        console.log(err);
      }
    },

    saveFilteredBrand: (record) => {
      try {
        set((state) => ({
          filteredBrands: [record, ...state.filteredBrands], // add at start
        }));
      } catch (err) {
        console.error(err);
      }
    },

    updateFilteredBrand: (record) => {
      try {
        set((state) => ({
          filteredBrands: state.filteredBrands.map((r) =>
            r?.id === record?.id ? { ...r, ...record } : r
          ),
        }));
      } catch (err) {
        console.log(err);
      }
    },

    deleteBrand: async (id) => {
      try {
        // ======= API CALL (commented for now) =======
        // const response = await GET(rentify_endpoints?.rentify?.brands?.delete(id));
        // handleStatusCode(response);
        // if (response?.status !== 200) {
        //   throw new Error(response?.message);
        // }

        const record = get().getBrand(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          brands: state.brands.filter((r) => r?.id !== id),
          brandsLoading: false,
          error: null,
        }));
      } catch (err) {
        console.log(err);
      }
    },
  })
  /*
    {
      name: "rentify-body-types-store",
    }
  )
  */
);

export const useBrandsFiltersStore = create((set, get) => ({
  filterValues: {
    brand_id: "",
    origin_country_id: "",
    active: "",
    vehicles_units: "",
    last_activity: "",
  },

  updateFilterValue: (key, val) => {
    const { filterValues } = get();
    set({ filterValues: { ...filterValues, [key]: val } });
  },
}));

export default useBrandsStore;
