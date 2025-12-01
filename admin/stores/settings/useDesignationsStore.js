"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";


const useDesignationsStore = create((set, get) => ({
  designations: [],
  designationsHasFetched: false,
  designationsLoading: false,
  error: null,
  selectedDesignation: null,


  // Fetch designations once
  fetchDesignations: async (force = false) => {
    const { designationsHasFetched } = get();

    // Skip fetch if already fetched and not forced
    if (!force && designationsHasFetched) return;    

    set({ designationsLoading: true, error: null });
    try {
      const response = await POST(crm_endpoints?.settings?.designations?.get);

      if (response?.status === 200) {
        set({
          designations: response?.data ?? [],
          designationsHasFetched: response?.data?.length > 0,
          designationsLoading: false,
        });
      } else {
        handleResponse(response);
        throw new Error(response?.message || "try : Fetch failed");
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      set({ error: "Failed to fetch designations", designationsLoading: false });
    }
  },

  // Get one record
  getDesignation: (id) => get().designations.find((r) => r?.id === id) || null,

  // Add new record
  saveDesignation: (data) => {
    toast.success("New record added");
    set((state) => ({
      designations: [...state.designations, data],
    }));
  },

  // Update existing record
  updateDesignation: (data) => {
    toast.success("Record updated");
    set((state) => ({
      designations: state.designations.map((r) =>
        r?.id === data?.id ? { ...r, ...data } : r
      ),
    }));
  },

  // Delete record (soft delete by setting deleted = 1)
  deleteDesignation: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.designations?.delete(id));
      if (response?.status === 200) {
        const record = get().getDesignation(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          designations: state.designations.map((r) =>
            r?.id === id ? { ...r, deleted: 1 } : r
          ),
          designationsLoading: false,
          error: null,
        }));

        toast.success(response?.message || "Record deleted");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  },

  // Restore record (deleted = 0)
  restoreDesignation: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.designations?.restore(id));
      if (response?.status === 200) {
        const record = get().getDesignation(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          designations: state.designations.map((r) =>
            r?.id === id ? { ...r, deleted: 0 } : r
          ),
          designationsLoading: false,
          error: null,
        }));

        toast.success("Record restored");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Restore failed");
    }
  },

  // Select / Clear record
  setSelectedDesignation: (record) => set({ selectedDesignation: record }),
  clearSelectedDesignation: () => set({ selectedDesignation: null }),
}));

export default useDesignationsStore;
