"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const usePermissionsStore = create((set, get) => ({
  permissions: [],
  permissionsHasFetched: false,
  permissionsLoading: false,
  error: null,
  selectedPermission: null,

  // Fetch permissions once
  fetchPermissions: async (force = false) => {
    const { permissionsHasFetched } = get();

    // Skip fetch if already fetched and not forced
    if (!force && permissionsHasFetched) return;    


    set({ permissionsLoading: true, error: null });
    try {
      const response = await GET(crm_endpoints?.permissions?.get);

      if (response?.status === 200) {
        set({
          permissions: response?.data ?? [],
          permissionsHasFetched: response?.data?.length > 0,
          permissionsLoading: false,
        });
      } else {
        handleResponse(response);
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      set({ error: "Failed to fetch permissions", permissionsLoading: false });
    }
  },

  // Get one record
  //getPermission: (id) => get().permissions.find((p) => Number(p?.id) === Number(id)) || null,
  getPermission: (id) => {
    const permission = get().permissions.find((p) => Number(p?.id) === Number(id));
    if (!permission) {
      console.warn(`❌ Permission with ID ${id} not found`);
    }
    return permission || null;
  },

  // Add new record
  savePermission: (data) => {
    toast.success("New permission added");
    set((state) => ({
      permissions: [...state.permissions, data],
    }));
  },

  // Update existing record
  updatePermission: (data) => {
    toast.success("Permission updated");
    set((state) => ({
      permissions: state.permissions.map((p) =>
        p?.id === data?.id ? { ...p, ...data } : p
      ),
    }));
  },

  // Delete record (soft delete by setting deleted = 1)
  deletePermission: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.permissions?.delete(id));
      if (response?.status === 200) {
        const record = get().getPermission(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          permissions: state.permissions.map((p) =>
            p?.id === id ? { ...p, deleted: 1 } : p
          ),
          permissionsLoading: false,
          error: null,
        }));

        toast.success(response?.message || "Permission deleted");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  },

  // Restore record (deleted = 0)
  restorePermission: async (id) => {
    try {
      const response = await GET(
        crm_endpoints?.settings?.permissions?.restore(id)
      );
      if (response?.status === 200) {
        const record = get().getPermission(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          permissions: state.permissions.map((p) =>
            p?.id === id ? { ...p, deleted: 0 } : p
          ),
          permissionsLoading: false,
          error: null,
        }));

        toast.success("Permission restored");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Restore failed");
    }
  },

  // Select / Clear record
  setSelectedPermission: (record) => set({ selectedPermission: record }),
  clearSelectedPermission: () => set({ selectedPermission: null }),
}));

export default usePermissionsStore;
