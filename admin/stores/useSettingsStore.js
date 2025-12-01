"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useSettingsStore = create(
  persist(
    (set, get) => ({
      settings: [],
      settingsHasFetched: false,

      rpp:10,

      fetchSettings: async () => {
        if (get().settingsHasFetched) return;

        try {
          // const response = await POST(crm_endpoints?.settings?.system?.get);
          const response = [];

          if (response?.status === 200) {
            set({
              rpp: response?.data?.rows_per_page ?? 20,
              settingsHasFetched: true,
            });
          } else {
            handleResponse(response);
            throw new Error(response?.message || "Fetch failed");
          }
        } catch (err) {
          console.error("❌ Fetch Error:", err);
          // Optionally handle error state here
        }
      },
    }),
    {
      name: "settings", // localStorage key
      skipHydration: true,
    }
  )
);

export default useSettingsStore;
