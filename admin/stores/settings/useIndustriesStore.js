"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useIndustriesStore = create((set, get) => ({
  industries: [],
  industriesHasFetched: false,
  industriesLoading: false,
  error: null,
  selectedIndustry: null,

  // Fetch industries once
  fetchIndustries: async (force = false) => {
    const { industriesHasFetched } = get();

    // Skip fetch if already fetched and not forced
    if (!force && industriesHasFetched) return;


    set({ industriesLoading: true, error: null });
    try {
      const response = await POST(crm_endpoints?.settings?.industries?.get);
      
console.log("response industries response 28")
console.log(response)

      if (response?.status === 200) {
        set({
          industries: response?.data ?? [],
          industriesHasFetched: response?.data?.length > 0,
          industriesLoading: false,
        });
      } else {
        handleResponse(response);
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      set({ error: "Failed to fetch industries", industriesLoading: false });
    }
  },

  // Get one record
  getIndustry: (id) => get().industries.find((r) => r?.id === id) || null,

  // Add new record
  saveIndustry: (data) => {
    toast.success("New industry added");
    set((state) => ({
      industries: [...state.industries, data],
    }));
  },

  // Update existing record
  updateIndustry: (data) => {
    toast.success("Industry updated");
    set((state) => ({
      industries: state.industries.map((r) =>
        r?.id === data?.id ? { ...r, ...data } : r
      ),
    }));
  },

  // Delete record (soft delete by setting deleted = 1)
  deleteIndustry: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.industries?.delete(id));
      if (response?.status === 200) {
        const record = get().getIndustry(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          industries: state.industries.map((r) =>
            r?.id === id ? { ...r, deleted: 1 } : r
          ),
          industriesLoading: false,
          error: null,
        }));

        toast.success(response?.message || "Industry deleted");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  },

  // Restore record (deleted = 0)
  restoreIndustry: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.industries?.restore(id));
      if (response?.status === 200) {
        const record = get().getIndustry(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          industries: state.industries.map((r) =>
            r?.id === id ? { ...r, deleted: 0 } : r
          ),
          industriesLoading: false,
          error: null,
        }));

        toast.success("Industry restored");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Restore failed");
    }
  },

  // Select / Clear record
  setSelectedIndustry: (record) => set({ selectedIndustry: record }),
  clearSelectedIndustry: () => set({ selectedIndustry: null }),
}));

export default useIndustriesStore;
