"use client";
import { create } from "zustand";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";

const useBodyTypesStore = create(
  //  persist(
  (set, get) => ({
    bodyTypes: [],
    bodyType: [],
    bodyTypesLoading: false,
    error: null,

    fetchBodyTypes: async (body = {}) => {
      //if (get().bodyTypes?.length) return;
      set({ bodyTypesLoading: true, error: null });

      try {
        const response = await POST(
          rentify_endpoints?.rentify?.bodyTypes?.get,
          body
        );
        if (response?.status === 200) {
          set({
            bodyTypes: response?.data,
            bodyTypesLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        set({
          error: "Failed to fetch body types",
          bodyTypesLoading: false,
        });
      }
    },

    getBodyType: (id) => get().bodyTypes.find((r) => r?.id === id) || null,

    saveBodyType: (record) => {
      try {
        set((state) => ({
          bodyTypes: [record, ...state.bodyTypes], // add at start
        }));
      } catch (err) {
        console.error(err);
      }
    },

    updateBodyType: (record) => {
      try {
        set((state) => ({
          bodyTypes: state.bodyTypes.map((r) =>
            r?.id === record?.id ? { ...r, ...record } : r
          ),
        }));
      } catch (err) {
        console.log(err);
      }
    },

    deleteBodyType: async (id) => {
      try {
        // ======= API CALL (commented for now) =======
        // const response = await GET(rentify_endpoints?.rentify?.bodyTypes?.delete(id));
        // handleStatusCode(response);
        // if (response?.status !== 200) {
        //   throw new Error(response?.message);
        // }

        const record = get().getBodyType(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          bodyTypes: state.bodyTypes.filter((r) => r?.id !== id),
          bodyTypesLoading: false,
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

export const useBodyTypesFiltersStore = create((set, get) => ({
  filterValues: {
    brand_id: null,
    bodyType_id: null,
    origin_country_id: null,
    last_activity: null,
  },

  updateFilterValue: (key, val) => {
    const { filterValues } = get();
    set({ filterValues: { ...filterValues, [key]: val } });
  },
}));

export default useBodyTypesStore;
