"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useFeaturesStore = create(
  //  persist(
  (set, get) => ({
    features: [],
    feature: [],
    featuresLoading: false,
    error: null,

    fetchFeatures: async (body = {}) => {
      //if (get().features?.length) return;
      set({ featuresLoading: true, error: null });

      try {
        const response = await POST(
          rentify_endpoints?.rentify?.features?.get,
          body
        );
        if (response?.status === 200) {
          set({
            features: response?.data,
            featuresLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        console.log(err);
        set({
          error: "Failed to fetch body types",
          featuresLoading: false,
        });
      }
    },

    getFeature: (id) => get().features.find((r) => r?.id === id) || null,

    saveFeature: (record) => {
      try {
        set((state) => ({
          features: [record, ...state.features], // add at start
        }));
      } catch (err) {
        console.error(err);
      }
    },

    updateFeature: (record) => {
      try {
        set((state) => ({
          features: state.features.map((r) =>
            r?.id === record?.id ? { ...r, ...record } : r
          ),
        }));
      } catch (err) {
        console.log(err);
      }
    },

    deleteFeature: async (id) => {
      try {
        // ======= API CALL (commented for now) =======
        // const response = await GET(rentify_endpoints?.rentify?.features?.delete(id));
        // handleStatusCode(response);
        // if (response?.status !== 200) {
        //   throw new Error(response?.message);
        // }

        const record = get().getFeature(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          features: state.features.filter((r) => r?.id !== id),
          featuresLoading: false,
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

export const useFeaturesFiltersStore = create((set, get) => ({
  filterValues: {
    brand_id: null,
    feature_id: null,
    origin_country_id: null,
    last_activity: null,
  },

  updateFilterValue: (key, val) => {
    const { filterValues } = get();
    set({ filterValues: { ...filterValues, [key]: val } });
  },
}));

export default useFeaturesStore;
