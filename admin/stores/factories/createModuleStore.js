// stores/factories/createModuleStore.js
"use client";

import { create } from "zustand";
import toast from "react-hot-toast";

import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import useToggleStore from "@/stores/useToggleStore";


/**
 * Generic Zustand store factory for any app module (CRM, CMS, eCommerce, etc.)
 *
 * @param {Object} config
 * @param {string} config.moduleName - e.g. "Call", "Meeting", "Lead"
 * @param {Object} config.endpoints - CRUD API endpoints for this module
 * @param {Object} config.filtersStore - Zustand filters store (optional)
 * @param {Object} config.viewTabsStore - Zustand view tabs store (optional)
 * @param {Object|Function} [config.extraMethods={}] - Optional custom module methods
 *
 * @returns {function} Zustand hook store
 *
 */
export default function createModuleStore({
  moduleName,
  endpoints,
  filtersStore,
  viewTabsStore,
  extraMethods = {},
  extraPayload = {},
}) {
  const lowerName = moduleName.toLowerCase();

  const baseStore = (set, get) => ({
    records: [],
    recordDetails: [],
    recordsLoading: false,
    loading: false,
    error: null,
    selectedRecord: null,
    fetchAll: false,
    kanbanData: [],
    kanbanDataLoading: false,

    page: 1,
    pages: 0,
    limit: 20,

    setFetchAll: (v) => set({ fetchAll: v }),
    setPage: (n) => set({ page: n }),

    // ✅ Fetch all records
    fetchRecords: async () => {
      set({ recordsLoading: true, error: null });
      try {
        // Validate endpoint exists
        if (!endpoints?.get) {
          console.error(`❌ Missing 'get' endpoint for ${moduleName}`);
          toast.error(`Configuration error: Missing API endpoint for ${moduleName}`);
          set({ recordsLoading: false, records: [] });
          return;
        }

        const getPayload =
          filtersStore?.getState?.().getPayload || (() => ({}));
        const activeTab = viewTabsStore?.getState?.().activeTab || "";


        // ✅ Normalize any { value, label } fields
        const filterFormValues = structuredClone(getPayload()); // or use JSON.parse(JSON.stringify(...)) for older browsers

        // ✅ Normalize {value, label} fields safely
        const normalizedFilters = Object.keys(filterFormValues).reduce(
          (acc, key) => {
            const val = filterFormValues[key];
            if (val && typeof val === "object" && "value" in val) {
              acc[key] = val.value;
            } else if (Array.isArray(val)) {
              acc[key] = val.map((item) =>
                typeof item === "object" && "value" in item ? item.value : item
              );
            } else {
              acc[key] = val;
            }
            return acc;
          },
          {}
        );

        const evaluatedExtraPayload =
          typeof extraPayload === "function"
            ? extraPayload(get)
            : extraPayload || {};

        const payload = {
          view: activeTab,
          page: get().page,
          limit: get().limit,
          fetchAll: get().fetchAll,
          ...normalizedFilters,
          ...evaluatedExtraPayload,
        };

        console.log(`📡 Fetching ${moduleName} from:`, endpoints.get);
        console.log(`📦 Payload:`, payload);

        const response = await POST(endpoints.get, payload);

        console.log(`✅ fetchRecords response for ${moduleName}:`, {
          status: response?.status,
          hasData: !!response?.data,
          dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
          dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A',
          pagination: response?.pagination,
          message: response?.message,
        });

        if (response?.status === 200) {
          // Ensure data is always an array
          const recordsData = Array.isArray(response?.data) 
            ? response.data 
            : response?.data?.records || response?.data?.data || [];
          
          console.log(`✅ Setting ${recordsData.length} ${moduleName} records`);
          
          set({
            records: recordsData,
            recordsLoading: false,
            pages: response?.pagination?.total_pages || response?.pages || 0,
            error: null,
          });
        } else {
          // Handle error response
          const errorMessage = response?.message || `Failed to fetch ${lowerName}s`;
          console.error(`❌ Fetch ${moduleName} error:`, {
            status: response?.status,
            message: errorMessage,
            response: response,
          });
          
          handleResponse(response);
          set({ 
            records: [],
            recordsLoading: false,
            error: errorMessage,
          });
        }
      } catch (err) {
        const errorMessage = err?.message || `Failed to fetch ${lowerName}s`;
        console.error(`❌ Fetch ${moduleName} exception:`, err);
        
        toast.error(errorMessage);
        set({
          error: errorMessage,
          records: [],
          recordsLoading: false,
        });
      }
    },

    // ✅ Fetch all records
    fetchKanbanRecords: async () => {
      set({ kanbanDataLoading: true, error: null });

      try {
        const getPayload =
          filtersStore?.getState?.().getPayload || (() => ({}));
        const activeTab = viewTabsStore?.getState?.().activeTab || "";


        // ✅ Normalize any { value, label } fields
        const filterFormValues = structuredClone(getPayload()); // or use JSON.parse(JSON.stringify(...)) for older browsers

        // ✅ Normalize {value, label} fields safely
        const normalizedFilters = Object.keys(filterFormValues).reduce(
          (acc, key) => {
            const val = filterFormValues[key];
            if (val && typeof val === "object" && "value" in val) {
              acc[key] = val.value;
            } else if (Array.isArray(val)) {
              acc[key] = val.map((item) =>
                typeof item === "object" && "value" in item ? item.value : item
              );
            } else {
              acc[key] = val;
            }
            return acc;
          },
          {}
        );

        const evaluatedExtraPayload =
          typeof extraPayload === "function"
            ? extraPayload(get)
            : extraPayload || {};

        const payload = {
          view: activeTab,
          page: get().page,
          limit: get().limit,
          fetchAll: get().fetchAll,
          ...normalizedFilters,
          ...evaluatedExtraPayload,
        };

        const response = await POST(endpoints.getByStatus, payload);

        console.log("fetch for kanban response: ", response);

        if (response?.status === 200) {
          set({
            kanbanData: response?.data ?? [],
            kanbanDataLoading: false,
            pages: response?.pagination?.total_pages,
          });
        } else {
          handleResponse(response);
          set({ kanbanDataLoading: false });
        }
      } catch (err) {
        set({
          error: err?.message || `Failed to fetch ${lowerName}s`,
          kanbanDataLoading: false,
        });
      }
    },
    setKanbanData: (data) => set({ kanbanData: data }),

    fetchRecordDetails: async (id = 0) => {
      if (!endpoints?.getDetails) {
        console.error(`❌ Missing 'getDetails' endpoint for ${moduleName}`);
        return;
      }

      // Start loading
      if (!id) return;
      set({ recordLoading: true });

      try {
        const response = await GET(endpoints.getDetails(id));

        console.log("response fetch details 96", response);

        if (response?.status === 200) {
          set({
            recordDetails: response?.data ?? {},
            recordLoading: false,
          });
        } else {
          handleResponse(response);
          set({ recordLoading: false });
        }
      } catch (err) {
        console.error(`❌ Error fetching ${moduleName} details:`, err);
        set({
          error: err?.message || `Failed to fetch ${lowerName}s`,
          recordLoading: false,
        });
      }
    },

    // ✅ Get one record locally
    getRecord: (id) => get().records.find((r) => r?.id === id) || null,

    // ✅ Save record (create new via API)
    saveRecord: async (data, { onSuccess } = {}) => {
      if (!endpoints?.save) {
        console.error(`❌ Missing 'save' endpoint for ${moduleName}`);
        return;
      }

      set({ recordsLoading: true });
      try {
        const response = await POST(endpoints.save, data);

        console.log("save response 98");
        console.log(response);
        ///return false

        if (response?.status === 200 || response?.status === 201) {
          const newRecord = response?.data || data;
          set((state) => ({
            records: [newRecord, ...state.records],
            recordsLoading: false,
          }));
          toast.success(response?.message || `New ${lowerName} added`);
          if (onSuccess && typeof onSuccess === "function") onSuccess();
        } else {
          handleResponse(response);
          set({ recordsLoading: false });
        }
      } catch (err) {
        set({ recordsLoading: false });
        toast.error(err?.message || `Failed to save ${lowerName}`);
      }
    },

    // ✅ Update record (via API)
    updateRecord: async (data, { onSuccess } = {}) => {
      if (!endpoints?.save) {
        console.error(`❌ Missing 'update' endpoint for ${moduleName}`);
        return;
      }

      const id = data?.id;
      if (!id) {
        toast.error("Record ID missing for update");
        return;
      }

      set({ recordsLoading: true });
      try {
        const response = await POST(endpoints?.save, data);

console.log("response 274 ");
console.log(response);

        if (response?.status === 200) {
          const updatedRecord = response?.data || data;
          set((state) => ({
            records: state.records.map((r) =>
              r?.id === id ? { ...r, ...updatedRecord } : r
            ),
            recordsLoading: false,
          }));
          toast.success(response?.message || `${moduleName} updated`);
          if (onSuccess && typeof onSuccess === "function") onSuccess();
        } else {
          handleResponse(response);
          set({ recordsLoading: false });
        }
      } catch (err) {
        set({ recordsLoading: false });
        toast.error(err?.message || `Failed to update ${lowerName}`);
      }
    },

    // ✅ Delete record (with confirm modal)
    deleteRecord: async (id) => {
      if (!id) return;
      const { open } = useToggleStore.getState();
      const { records } = get();

      open(`Are you sure you want to delete this ${lowerName}?`, async () => {
        try {
          const response = await GET(
            typeof endpoints.delete === "function"
              ? endpoints.delete(id)
              : endpoints.delete
          );
          if (response?.status === 200) {
            const updatedRecords = records.filter((r) => r.id !== id);
            set({ records: updatedRecords });
            toast.success(
              response?.message || `${moduleName} deleted successfully`
            );
          } else handleResponse(response);
        } catch (err) {
          toast.error(err?.message || "Delete failed");
        }
      });
    },

    // ✅ Restore record
    restoreRecord: async (id) => {
      set({ recordsLoading: true });
      try {
        const response = await GET(
          typeof endpoints.restore === "function"
            ? endpoints.restore(id)
            : endpoints.restore
        );
        if (response?.status === 200) {
          set((state) => ({
            records: state.records.map((r) =>
              r?.id === id ? { ...r, deleted: 0 } : r
            ),
            recordsLoading: false,
          }));
          toast.success(`${moduleName} restored`);
        } else {
          handleResponse(response);
          set({ recordsLoading: false });
        }
      } catch (err) {
        set({ recordsLoading: false });
        toast.error(err?.message || "Restore failed");
      }
    },

    // ✅ Toggle favorite (1 ↔ 0)
    markAsFavorite: async (id) => {
      if (!id) return;

      const { records } = get();
      const target = records.find((r) => r.id === id);
      if (!target) return;

      const newFav = target.favorite === 1 ? 0 : 1;
      try {
        const response = await GET(
          typeof endpoints.favorite === "function"
            ? endpoints.favorite(id, newFav)
            : endpoints.favorite
        );
        if (response?.status === 200) {
          const updated = records.map((r) =>
            r.id === id ? { ...r, favorite: newFav } : r
          );
          set({ records: updated });
          toast.success(`${moduleName} updated favorite status.`);
        } else {
          toast.error("Failed to update favorite status.");
        }
      } catch (err) {
        toast.error("Failed to update favorite.");
      }
    },

    // ✅ Selection
    setSelectedRecord: (record) => set({ selectedRecord: record }),
    clearSelectedRecord: () => set({ selectedRecord: null }),
  });

  // Support extraMethods as either a function (set, get) => ({ ... }) or a plain object
  return create((set, get) => {
    const base = baseStore(set, get);
    const extras =
      typeof extraMethods === "function"
        ? extraMethods(set, get)
        : extraMethods || {};
    return {
      ...base,
      ...extras,
    };
  });
}
