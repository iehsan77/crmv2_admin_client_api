"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useProfilesStore = create((set, get) => ({
  profiles: [],
  profilesHasFetched: false,
  profilesLoading: false,
  error: null,
  selectedProfile: null,

  // Fetch profiles once
  fetchProfiles: async (force = false) => {
    const { profilesHasFetched } = get();

    // Skip fetch if already fetched and not forced
    if (!force && profilesHasFetched) return;


    set({ profilesLoading: true, error: null });
    try {
      const response = await POST(crm_endpoints?.settings?.profiles?.get);
      if (response?.status === 200) {
        set({
          profiles: response?.data ?? [],
          profilesHasFetched: response?.data?.length > 0,
          profilesLoading: false,
        });
      } else {
        handleResponse(response);
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      set({ error: "Failed to fetch profiles", profilesLoading: false });
    }
  },

  // Get one record
  //getProfile: (id) => get().profiles.find((p) => Number(p?.id) === Number(id)) || null,
  getProfile: (id) => {
    const profile = get().profiles.find((p) => Number(p?.id) === Number(id));
    if (!profile) {
      console.warn(`❌ Profile with ID ${id} not found`);
    }
    return profile || null;
  },

  // Add new record
  saveProfile: (data) => {
    toast.success("New profile added");
    set((state) => ({
      profiles: [...state.profiles, data],
    }));
  },

  // Update existing record
  updateProfile: (data) => {
    toast.success("Profile updated");
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p?.id === data?.id ? { ...p, ...data } : p
      ),
    }));
  },

  // Delete record (soft delete by setting deleted = 1)
  deleteProfile: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.profiles?.delete(id));
      if (response?.status === 200) {
        const record = get().getProfile(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          profiles: state.profiles.map((p) =>
            p?.id === id ? { ...p, deleted: 1 } : p
          ),
          profilesLoading: false,
          error: null,
        }));

        toast.success(response?.message || "Profile deleted");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  },

  // Restore record (deleted = 0)
  restoreProfile: async (id) => {
    try {
      const response = await GET(
        crm_endpoints?.settings?.profiles?.restore(id)
      );
      if (response?.status === 200) {
        const record = get().getProfile(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          profiles: state.profiles.map((p) =>
            p?.id === id ? { ...p, deleted: 0 } : p
          ),
          profilesLoading: false,
          error: null,
        }));

        toast.success("Profile restored");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Restore failed");
    }
  },

  // Select / Clear record
  setSelectedProfile: (record) => set({ selectedProfile: record }),
  clearSelectedProfile: () => set({ selectedProfile: null }),
}));

export default useProfilesStore;
