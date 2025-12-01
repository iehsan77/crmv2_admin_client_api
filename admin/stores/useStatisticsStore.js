"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import useCommonStore from "@/stores/useCommonStore";

const useStatisticsStore = create((set) => ({
  statistics: [],
  statisticsLoading: false,
  error: null,

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

      const response = await POST(url, body);

      if (response?.status === 200) {
        // Ensure we have an array of statistics
        const statisticsData = Array.isArray(response?.data) 
          ? response.data 
          : [];
        
        set({ 
          statistics: statisticsData,
          statisticsLoading: false,
          error: null 
        });
      } else {
        handleResponse(response);
        set({ 
          statistics: [],
          statisticsLoading: false,
          error: response?.message || "Failed to fetch statistics"
        });
      }
    } catch (err) {
      const errorMessage = err?.message || "Failed to fetch statistics";
      set({ 
        error: errorMessage,
        statistics: [],
        statisticsLoading: false 
      });
      
      // Only show toast for non-abort errors
      if (err.name !== "AbortError") {
        toast.error(errorMessage);
      }
    }
  },
}));

export default useStatisticsStore;
