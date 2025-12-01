"use client";
import { create } from "zustand";
import { POST } from "@/helper/ServerSideActions";
import { common_endpoints } from "@/utils/common_endpoints";

const useAttachmentsStore = create((set, get) => ({
  // 🧩 State
  records: [],
  record: null,
  selectedRecord: null,
  recordsLoading: false,
  error: null,

  // ✅ Fetch all records
  fetchRecords: async (body = {}) => {
    set({ recordsLoading: true, error: null });

    try {
      const response = await POST(
        common_endpoints?.attachments?.get,
        body
      );

      if (response?.status === 200) {
        set({
          records: response?.data || [],
          recordsLoading: false,
        });
      } else {
        throw new Error(response?.message || "Failed to fetch records");
      }
    } catch (err) {
      console.error("❌ Fetch Records Error:", err);
      set({
        error: "Failed to fetch records",
        recordsLoading: false,
      });
    }
  },

  // ✅ Get single record by ID
  getRecord: (id) =>
    get().records.find((r) => r?.id === id) || null,

  // ✅ Set / Clear selected record
  setSelectedRecord: (record) => set({ selectedRecord: record, record: record }),
  clearSelectedRecord: () => set({ selectedRecord: null, record: null }),

  // ✅ Save (upload/create)
  saveRecord: async (record) => {
    try {
      set({ recordsLoading: true });
      const response = await POST(common_endpoints?.attachments?.save, record);

console.log("attachments response")
console.log(response)
return false


      if (response?.status === 200) {
        await get().fetchRecords();
      } else {
        throw new Error(response?.message || "Failed to save record");
      }

      return response;
    } catch (err) {
      console.error("❌ Save Record Error:", err);
      set({ error: "Failed to save record" });
      throw err;
    } finally {
      set({ recordsLoading: false });
    }
  },

  // ✅ Update (local)
  updateRecord: (record) => {
    try {
      set((state) => ({
        records: state.records.map((r) =>
          r?.id === record?.id ? { ...r, ...record } : r
        ),
      }));
    } catch (err) {
      console.error("❌ Update Record Error:", err);
    }
  },

  // ✅ Delete
  deleteRecord: async (id) => {
    try {
      set({ recordsLoading: true });
      const response = await POST(
        common_endpoints?.attachments?.delete?.(id)
      );

      if (response?.status === 200) {
        set((state) => ({
          records: state.records.filter((r) => r?.id !== id),
          recordsLoading: false,
        }));
      } else {
        throw new Error(response?.message || "Failed to delete record");
      }

      return response;
    } catch (err) {
      console.error("❌ Delete Record Error:", err);
      set({
        error: "Failed to delete record",
        recordsLoading: false,
      });
    }
  },
}));

export default useAttachmentsStore;
