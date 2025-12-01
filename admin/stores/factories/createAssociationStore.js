"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { POST } from "@/helper/ServerSideActions";
import { crm_endpoints } from "@/utils/crm_endpoints";

/**
 * Association Store
 * Handles linking/unlinking between CRM modules (like Leads ↔ Accounts)
 */
const createAssociationStore = () => {
  // --- Fixed API endpoints ---
  const endpoints = {
    get: async (payload) =>
      await POST(crm_endpoints?.crm?.associations?.get, payload),
    save: async (payload) =>
      await POST(crm_endpoints?.crm?.associations?.save, payload),
    delete: async (id) =>
      await POST(crm_endpoints?.crm?.associations?.delete(id)),
    restore: async (id) =>
      await POST(crm_endpoints?.crm?.associations?.restore(id)),
  };

  return create(
    devtools((set, get) => ({
      loading: false,
      record: [],
      records: [],
      selectedIds: [],
      counter: 0,

      // --- Core Setters ---
      setLoading: (value) => set({ loading: value }),
      setRecords: (data) => set({ records: data }),
      setSelectedIds: (ids) => set({ selectedIds: ids }),

      // --- Fetch Associations ---
      fetchRecords: async (payload = {}) => {
        try {
          set({ loading: true });
          const response = await endpoints.get(payload);

          set({
            record: response?.data || [],
            counter: response?.data?.target_module_ids_details?.length || 0,
            selectedIds: response?.data?.target_module_ids || [],
            records: response?.data?.target_module_ids_details || [],
          });
        } catch (error) {
          console.error("Association fetch error:", error);
        } finally {
          set({ loading: false });
        }
      },

      // --- Save Association ---
      saveRecord: async (payload) => {
        try {
          set({ loading: true });
          const response = await endpoints.save(payload);

          const { source_module, source_module_id, target_module } = payload;

          if (source_module && source_module_id && target_module) {
            await get().fetchRecords({
              source_module,
              source_module_id,
              target_module,
            });
          }

          return response;
        } catch (error) {
          console.error("Association save error:", error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // --- Delete Association ---
      deleteRecord: async (id) => {
        try {
          set({ loading: true });
          await endpoints.delete(id);
          set({ records: get().records.filter((r) => r.id !== id) });
        } catch (error) {
          console.error("Association delete error:", error);
        } finally {
          set({ loading: false });
        }
      },

      // --- Restore Association ---
      restoreRecord: async (id) => {
        try {
          set({ loading: true });
          await endpoints.restore(id);
        } catch (error) {
          console.error("Association restore error:", error);
        } finally {
          set({ loading: false });
        }
      },
    }))
  );
};

export default createAssociationStore;
