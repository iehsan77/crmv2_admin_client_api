"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import useCommonStore from "@/stores/useCommonStore";

const useStatisticsStore = create((set) => ({
  statistics: [],
  statisticsLoading: false,
  error: null, // ✅ define properly

  // 📊 Fetch statistics
  fetchStatistics: async (url) => {
    if (!url) {
      toast.error("Statistics URL is missing");
      return;
    }

    set({ statisticsLoading: true, error: null });

    try {
      const { range } = useCommonStore.getState();

      if (!range?.from || !range?.to) {
        throw new Error("Date range is missing");
      }

      const body = {
        from: new Date(range.from).toISOString(),
        to: new Date(range.to).toISOString(),
      };
//console.log("body 26"); console.log(body);

      const response = await POST(url, body);

console.log("statistics response 37"); console.log(response);

      if (response?.status === 200) {
        set({ statistics: response?.data ?? [] });
      } else {
        handleResponse(response);
      }
    } catch (err) {
      set({ error: err?.message || "Failed to fetch statistics" });
      toast.error(err?.message || "Failed to fetch statistics");
    } finally {
      set({ statisticsLoading: false });
    }
  },
}));

export default useStatisticsStore;
