"use client";
import React from "react";
import { create } from "zustand";
import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { GET, POST_JSON } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useSystemUsersStore = create((set, get) => ({
  systemUsers: [],
  systemUsersHasFetched: false,
  systemUsersLoading: false,
  error: null,
  selectedSystemUser: null,

  // ✅ Fetch system users once
  fetchSystemUsers: async (force = false) => {
    const { systemUsersHasFetched } = get();

    // Skip fetch if already fetched and not forced
    if (!force && systemUsersHasFetched) return;

    set({ systemUsersLoading: true, error: null });
    try {
      const response = await POST_JSON(
        crm_endpoints?.settings?.["system-users"]?.get
      );

      if (response?.status === 200) {
        set({
          systemUsers: response?.data ?? [],
          systemUsersHasFetched: response?.data?.length > 0,
          systemUsersLoading: false,
        });
      } else {
        handleResponse(response);
        set({ systemUsersLoading: false });
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      set({ error: "Failed to fetch system users", systemUsersLoading: false });
    }
  },

  // ✅ For dropdown use without React hook
  getSystemUsersDropdown: async (force = false) => {
    const { systemUsers, fetchSystemUsers } = get();

    if (!systemUsers.length || force) {
      await fetchSystemUsers(force);
    }

    const { systemUsers: updatedUsers } = get();

    return updatedUsers
      .filter((u) => !u?.deleted)
      .map((u) => ({
        label:
          `${u?.first_name ?? ""} ${u?.last_name ?? ""} (${u?.email ?? ""})`.trim() ||
          `User #${u?.id}`,
        value: u?.id,
      }));
  },

  // ✅ Get single record
  getSystemUser: (id) => get().systemUsers.find((r) => r?.id === id) || null,

  // ✅ Add new
  saveSystemUser: (data) => {
    toast.success("New system user added");
    set((state) => ({
      systemUsers: [...state.systemUsers, data],
    }));
  },

  // ✅ Update
  updateSystemUser: (data) => {
    toast.success("System user updated");
    set((state) => ({
      systemUsers: state.systemUsers.map((r) =>
        r?.id === data?.id ? { ...r, ...data } : r
      ),
    }));
  },

  // ✅ Soft delete
  deleteSystemUser: async (id) => {
    try {
      const response = await GET(
        crm_endpoints?.settings?.["system-users"]?.delete(id)
      );

      if (response?.status === 200) {
        set((state) => ({
          systemUsers: state.systemUsers.map((r) =>
            r?.id === id ? { ...r, deleted: 1 } : r
          ),
          systemUsersLoading: false,
          error: null,
        }));
        toast.success(response?.message || "System user deleted");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  },

  // ✅ Select / Clear
  setSelectedSystemUser: (record) => set({ selectedSystemUser: record }),
  clearSelectedSystemUser: () => set({ selectedSystemUser: null }),
}));

export default useSystemUsersStore;
