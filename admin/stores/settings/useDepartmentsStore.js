"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useDepartmentsStore = create((set, get) => ({
  departments: [],
  departmentsHasFetched: false,
  departmentsLoading: false,
  error: null,
  selectedDepartment: null,

  // Fetch departments once
  fetchDepartments: async (force = false) => {
    const { departmentsHasFetched } = get();

    // Skip fetch if already fetched and not forced
    if (!force && departmentsHasFetched) return;


    set({ departmentsLoading: true, error: null });
    try {
      const response = await POST(crm_endpoints?.settings?.departments?.get);
      
      if (response?.status === 200) {
        set({
          departments: response?.data ?? [],
          departmentsHasFetched: response?.data?.length > 0,
          departmentsLoading: false,
        });
      } else {
        handleResponse(response);
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      set({ error: "Failed to fetch departments", departmentsLoading: false });
    }
  },

  // Get one record
  getDepartment: (id) => get().departments.find((r) => r?.id === id) || null,

  // Add new record
  saveDepartment: (data) => {
    toast.success("New department added");
    set((state) => ({
      departments: [...state.departments, data],
    }));
  },

  // Update existing record
  updateDepartment: (data) => {
    toast.success("Department updated");
    set((state) => ({
      departments: state.departments.map((r) =>
        r?.id === data?.id ? { ...r, ...data } : r
      ),
    }));
  },

  // Delete record (soft delete by setting deleted = 1)
  deleteDepartment: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.departments?.delete(id));
      if (response?.status === 200) {
        const record = get().getDepartment(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          departments: state.departments.map((r) =>
            r?.id === id ? { ...r, deleted: 1 } : r
          ),
          departmentsLoading: false,
          error: null,
        }));

        toast.success(response?.message || "Department deleted");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  },

  // Restore record (deleted = 0)
  restoreDepartment: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.departments?.restore(id));
      if (response?.status === 200) {
        const record = get().getDepartment(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          departments: state.departments.map((r) =>
            r?.id === id ? { ...r, deleted: 0 } : r
          ),
          departmentsLoading: false,
          error: null,
        }));

        toast.success("Department restored");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Restore failed");
    }
  },

  // Select / Clear record
  setSelectedDepartment: (record) => set({ selectedDepartment: record }),
  clearSelectedDepartment: () => set({ selectedDepartment: null }),
}));

export default useDepartmentsStore;
