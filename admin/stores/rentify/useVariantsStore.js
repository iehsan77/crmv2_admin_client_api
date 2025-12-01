"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useVariantsStore = create(
  // persist(
  (set, get) => ({
    variants: [],
    variant: null, // single variant object instead of []
    variantsLoading: false,
    error: null,

    fetchVariants: async (body = {}) => {
      set({ variantsLoading: true, error: null });
      try {
        const response = await POST(
          rentify_endpoints?.rentify?.variants?.get,
          body
        );

        if (response?.status === 200) {
          set({
            variants: response?.data || [],
            variantsLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        console.error(err);
        set({
          error: "Failed to fetch variants",
          variantsLoading: false,
        });
      }
    },

    getVariant: (id) => get().variants.find((r) => r?.id === id) || null,

    getVariantsByBrandAndModelId: (brand_id, model_id) => {
      const { variants } = get();
      const bId = Number(brand_id);
      const mId = Number(model_id);

      return variants.filter(
        (r) => Number(r?.brand_id) === bId && Number(r?.model_id) === mId
      );
    },

    getVariantsByBrandAndModelIds: (brand_ids = [], model_ids = []) =>
      get().variants.filter(
        (r) =>
          brand_ids?.includes(Number(r?.brand_id)) &&
          model_ids?.includes(Number(r?.model_id))
      ),

    saveVariant: (record) => {
      try {
        set((state) => ({
          variants: [record, ...state.variants],
        }));
      } catch (err) {
        console.error("Save variant failed:", err);
      }
    },

    updateVariant: (record) => {
      try {
        set((state) => ({
          variants: state.variants.map((r) =>
            r?.id === record?.id ? { ...r, ...record } : r
          ),
        }));
      } catch (err) {
        console.error("Update variant failed:", err);
      }
    },

    deleteVariant: async (id) => {
      try {
        // ===== API call (uncomment if needed) =====
        // const response = await GET(rentify_endpoints?.rentify?.variants?.delete(id));
        // handleResponse(response);
        // if (response?.status !== 200) throw new Error(response?.message);

        const record = get().getVariant(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          variants: state.variants.filter((r) => r?.id !== id),
          variantsLoading: false,
          error: null,
        }));
      } catch (err) {
        console.error("Delete variant failed:", err);
      }
    },
  })
  /*
  , {
    name: "rentify-variants-store", // enable persistence if needed
  })
  */
);

export const useVariantsFiltersStore = create((set, get) => ({
  filterValues: {
    brand_id: null,
    variant_id: null,
    origin_country_id: null,
    last_activity: null,
  },

  updateFilterValue: (key, val) => {
    const { filterValues } = get();
    set({ filterValues: { ...filterValues, [key]: val } });
  },
}));

export default useVariantsStore;
