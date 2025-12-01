"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useModelsStore = create(
  //  persist(
  (set, get) => ({
    models: [],
    modelsForDropdown: [],
    model: [],
    modelsLoading: false,
    error: null,

    fetchModels: async (body = {}) => {
      //if (get().models?.length) return;
      set({ modelsLoading: true, error: null });
//alert("called model")
      try {
        const response = await POST(
          rentify_endpoints?.rentify?.models?.get,
          body
        );
        //console.log("model body 54"); console.log(body);
        //console.log("model response 54"); console.log(response);
        if (response?.status === 200) {
          set({
            models: response?.data,
            modelsLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        console.log(err);
        set({
          error: "Failed to fetch body types",
          modelsLoading: false,
        });
      }
    },



    fetchModelsForDropdown: async () => {
      set({ modelsLoading: true, error: null });

      try {
        const response = await GET(rentify_endpoints?.rentify?.models?.getForDropdown);

//console.log("response 54"); console.log(response); return false;


        if (response?.status !== 200) {
          throw new Error(response?.message || "Fetch failed");
        }

        const data = Array.isArray(response?.data) ? response.data : [];

        const filtered = data.map(({ id, title }) => ({
            value: String(id),
            label: String(title),
          }));

        set({
          modelsForDropdown: filtered,
          modelsLoading: false,
        });
      } catch (err) {
        console.log(err);
        set({
          error: "Failed to fetch models",
          modelsLoading: false,
          modelsForDropdown: [], // ensure reset on failure
        });
      }
    },    


    getModel: (id) => get().models.find((r) => r?.id === id) || null,

    getModelsByBrandId: (id) => {
      return get().models.filter((r) => Number(r?.brand_id) === Number(id));
    },

    getModelsByBrandIds: (ids) => {
      return get().models.filter((r) => ids.includes(Number(r?.brand_id)));
    },

    saveModel: (record) => {
      try {
        set((state) => ({
          models: [record, ...state.models], // add at start
        }));
      } catch (err) {
        console.error(err);
      }
    },

    updateModel: (record) => {
      try {
        set((state) => ({
          models: state.models.map((r) =>
            r?.id === record?.id ? { ...r, ...record } : r
          ),
        }));
      } catch (err) {
        console.log(err);
      }
    },

    deleteModel: async (id) => {
      try {
        // ======= API CALL (commented for now) =======
        // const response = await GET(rentify_endpoints?.rentify?.models?.delete(id));
        // handleStatusCode(response);
        // if (response?.status !== 200) {
        //   throw new Error(response?.message);
        // }

        const record = get().getModel(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          models: state.models.filter((r) => r?.id !== id),
          modelsLoading: false,
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

export const useModelsFiltersStore = create((set, get) => ({
  filterValues: {
    brand_id: null,
    model_id: null,
    origin_country_id: null,
    last_activity: null,
  },

  updateFilterValue: (key, val) => {
    const { filterValues } = get();
    set({ filterValues: { ...filterValues, [key]: val } });
  },
}));

export default useModelsStore;
