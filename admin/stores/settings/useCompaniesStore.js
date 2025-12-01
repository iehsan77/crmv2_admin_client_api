"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useCompaniesStore = create((set, get) => ({
  companies: [],
  companiesHasFetched: false,
  companiesLoading: false,
  error: null,
  selectedCompany: null,
  viewCompany: null,

  // Fetch companies once
  fetchCompanies: async (force = false) => {
    const { companiesHasFetched } = get();

    // Skip fetch if already fetched and not forced
    if (!force && companiesHasFetched) return;    



    set({ companiesLoading: true, error: null });
    try {
      const response = await POST(crm_endpoints?.settings?.companies?.get);


      if (response?.status === 200) {
        set({
          companies: response?.data ?? [],
          companiesHasFetched: response?.data?.length > 0,
          companiesLoading: false,
        });
      } else {
        handleResponse(response);
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      set({ error: "Failed to fetch companies", companiesLoading: false });
    }
  },

  // Get one record
  getCompany: (id) => get().companies.find((r) => r?.id === id) || null,

  // Add new record
  saveCompany: (data) => {
    toast.success("New company added");
    set((state) => ({
      companies: [...state.companies, data],
    }));
  },

  // Update existing record
  updateCompany: (data) => {
    toast.success("Company updated");
    set((state) => ({
      companies: state.companies.map((r) =>
        r?.id === data?.id ? { ...r, ...data } : r
      ),
    }));
  },

  // Delete record (soft delete by setting deleted = 1)
  deleteCompany: async (id) => {
    try {
      const response = await GET(
        crm_endpoints?.settings?.companies?.delete(id)
      );
      if (response?.status === 200) {
        const record = get().getCompany(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          companies: state.companies.map((r) =>
            r?.id === id ? { ...r, deleted: 1 } : r
          ),
          companiesLoading: false,
          error: null,
        }));

        toast.success(response?.message || "Company deleted");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  },

  // Restore record (deleted = 0)
  restoreCompany: async (id) => {
    try {
      const response = await GET(
        crm_endpoints?.settings?.companies?.restore(id)
      );
      if (response?.status === 200) {
        const record = get().getCompany(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          companies: state.companies.map((r) =>
            r?.id === id ? { ...r, deleted: 0 } : r
          ),
          companiesLoading: false,
          error: null,
        }));

        toast.success("Company restored");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Restore failed");
    }
  },

  // Select / Clear record
  setSelectedCompany: (record) => set({ selectedCompany: record }),
  clearSelectedCompany: () => set({ selectedCompany: null }),

  // Select / Clear record
  setViewCompany: (record) => set({ viewCompany: record }),
  clearViewCompany: () => set({ viewCompany: null }),
}));

export default useCompaniesStore;
