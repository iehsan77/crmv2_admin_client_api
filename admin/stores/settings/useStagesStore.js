"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useStagesStore = create((set, get) => ({
  stages: [],
  stagesHasFetched: false,
  stagesLoading: false,
  error: null,
  selectedStage: null,

  // Fetch stages once
  fetchStages: async (force = false) => {
    const { stagesHasFetched } = get();

    // Skip fetch if already fetched and not forced
    if (!force && stagesHasFetched) return;

    set({ stagesLoading: true, error: null });
    try {
      const response = await POST(crm_endpoints?.crm?.deals?.stages?.get);
      
      if (response?.status === 200) {
        set({
          stages: response?.data ?? [],
          stagesHasFetched: response?.data?.length > 0,
          stagesLoading: false,
        });
      } else {
        handleResponse(response);
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      set({ error: "Failed to fetch stages", stagesLoading: false });
    }
  },

  // Get one record
  getStage: (id) => get().stages.find((r) => r?.id === id) || null,

  // Add new record
  saveStage: (data) => {
    toast.success("New stage added");
    set((state) => ({
      stages: [...state.stages, data],
    }));
  },

  // Update existing record
  updateStage: (data) => {
    toast.success("Stage updated");
    set((state) => ({
      stages: state.stages.map((r) =>
        r?.id === data?.id ? { ...r, ...data } : r
      ),
    }));
  },

  // Delete record (soft delete by setting deleted = 1)
  deleteStage: async (id) => {
    try {
      const response = await GET(crm_endpoints?.crm?.deals?.stages?.delete(id));
      if (response?.status === 200) {
        const record = get().getStage(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          stages: state.stages.map((r) =>
            r?.id === id ? { ...r, deleted: 1 } : r
          ),
          stagesLoading: false,
          error: null,
        }));

        toast.success(response?.message || "Stage deleted");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  },

  // Restore record (deleted = 0)
  restoreStage: async (id) => {
    try {
      const response = await GET(crm_endpoints?.crm?.deals?.stages?.restore(id));
      if (response?.status === 200) {
        const record = get().getStage(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          stages: state.stages.map((r) =>
            r?.id === id ? { ...r, deleted: 0 } : r
          ),
          stagesLoading: false,
          error: null,
        }));

        toast.success("Stage restored");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Restore failed");
    }
  },

  // Select / Clear record
  setSelectedStage: (record) => set({ selectedStage: record }),
  clearSelectedStage: () => set({ selectedStage: null }),
}));

export default useStagesStore;
