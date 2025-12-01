"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useSmsStore = create((set, get) => ({
  sms: [],
  smsHasFetched: false,
  smsLoading: false,
  error: null,
  selectedSms: null,

  // Fetch SMS integrations once
  fetchSms: async (force = false) => {
    const { smsHasFetched } = get();

    // Skip fetch if already fetched and not forced
    if (!force && smsHasFetched) return;

    set({ smsLoading: true, error: null });
    try {
      const response = await POST(crm_endpoints?.settings?.integrations?.sms?.get);
      if (response?.status === 200) {
        set({
          sms: response?.data ?? [],
          smsHasFetched: response?.data?.length > 0,
          smsLoading: false,
        });
      } else {
        handleResponse(response);
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      set({ error: "Failed to fetch sms", smsLoading: false });
    }
  },

  // Get one record
  getSms: (id) => get().sms.find((r) => r?.id === id) || null,

  // Add new record
  saveSms: (data) => {
    toast.success("New SMS added");
    set((state) => ({
      sms: [...state.sms, data],
    }));
  },

  // Update existing record
  updateSms: (data) => {
    toast.success("SMS updated");
    set((state) => ({
      sms: state.sms.map((r) =>
        r?.id === data?.id ? { ...r, ...data } : r
      ),
    }));
  },

  // Delete record (soft delete by setting deleted = 1)
  deleteSms: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.integrations?.sms?.delete(id));
      if (response?.status === 200) {
        const record = get().getSms(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          sms: state.sms.map((r) =>
            r?.id === id ? { ...r, deleted: 1 } : r
          ),
          smsLoading: false,
          error: null,
        }));

        toast.success(response?.message || "SMS deleted");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  },

  // Restore record (deleted = 0)
  restoreSms: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.integrations?.sms?.restore(id));
      if (response?.status === 200) {
        const record = get().getSms(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          sms: state.sms.map((r) =>
            r?.id === id ? { ...r, deleted: 0 } : r
          ),
          smsLoading: false,
          error: null,
        }));

        toast.success("SMS restored");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Restore failed");
    }
  },

  // Select / Clear record
  setSelectedSms: (record) => set({ selectedSms: record }),
  clearSelectedSms: () => set({ selectedSms: null }),
}));

export default useSmsStore;
