"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { POST, GET } from "@/helper/ServerSideActions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import toast from "react-hot-toast";

const MAX_TABS = 5;
const MAX_FILTERS = 5;

const useNotesStore = create(
  //persist(
  (set, get) => ({
    notes: [],
    notesLoading: false,
    error: null,

    fetchNotes: async (id = {}) => {
      set({ notesLoading: true, error: null });

      try {
        const response = await GET(
          rentify_endpoints?.rentify?.affiliates?.getNotes(id)
        );
        console.log(response);
        if (response?.status === 200) {
          set({
            notes: response?.data,
            notesLoading: false,
          });
        } else {
          toast.error("An error occurred while fetching data.");
        }
      } catch (err) {
        set({
          error: "Failed to fetch data",
          notesLoading: false,
        });
      }
    },

    // Get single record
    getNote: (id) => get().notes.find((r) => r?.id === id) || null,

    // Add new note
    saveNote: (data) => {
      try {
        // ======= API CALL (commented for now) =======
        // await POST_JSON(endpoints?.notes?.add, data);

        set((state) => ({
          notes: [...state.notes, data],
        }));
      } catch (err) {
        console.log(err);
      }
    },

    // Update note
    updateNote: (data) => {
      try {
        // ======= API CALL (commented for now) =======
        // await POST_JSON(endpoints?.notes?.update(data.id), data);

        set((state) => ({
          notes: state.notes.map((r) =>
            r?.id === data?.id ? { ...r, ...data } : r
          ),
        }));
      } catch (err) {
        console.log(err);
      }
    },

    // Delete note
    deleteNote: async (id) => {
      try {
        // ======= API CALL (commented for now) =======
        // const response = await GET(endpoints?.notes?.delete(id));
        // handleStatusCode(response);
        // if (response?.status !== 200) {
        //   throw new Error(response?.message);
        // }

        const record = get().getNote(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          notes: state.notes.filter((r) => r?.id !== id),
          notesLoading: false,
          error: null,
        }));
      } catch (err) {
        console.log(err);
      }
    },
  }),
  {
    name: "notes-store", // localStorage key
  }
  //)
);

const useAffiliateTabsStore = create((set, get) => ({
  tabs: ["Overview", "Activity / Timelines"],
  selectedTab: "Overview",
  setSelectedTab: (tab) => set({ selectedTab: tab }),

  innerTabs: ["Notes", "Attachments"],
  innerSelectedTab: "Notes",
  setInnerSelectedTab: (innerTab) => set({ innerSelectedTab: innerTab }),
}));

const useAttachementsViewTabsStore = create((set, get) => ({
  tabs: [
    { label: "Business Documents", value: "business_documents" },
    { label: "Vehicle Documents", value: "vehicle_documents" },
    { label: "Booking Documents", value: "booking_documents" },
    { label: "Miscellaneous", value: "miscellaneous" },
  ],
  activeTab: "business_documents",

  setTabs: (tabs) => set({ tabs }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addTab: (tab) => {
    const { tabs } = get();
    if (tabs.find((t) => t.value === tab.value)) {
      set({ activeTab: tab.value });
      return true;
    }
    if (tabs.length >= MAX_TABS) {
      console.warn(`Max ${MAX_TABS} tabs allowed`);
      return false;
    }
    set({ tabs: [...tabs, tab], activeTab: tab.value });
    return true;
  },

  removeTab: (value) => {
    if (value !== "business_documents") {
      const { tabs, activeTab } = get();
      const updatedTabs = tabs.filter((t) => t.value !== value);
      let newActive = activeTab;
      if (activeTab === value && updatedTabs.length > 0) {
        newActive = updatedTabs[0].value;
      }
      set({ tabs: updatedTabs, activeTab: newActive });
    }
  },

  getMaxTabs: () => MAX_TABS,
}));

const useAttachmentsStore = create(
  //persist(
  (set, get) => ({
    attachments: [],
    attachmentsLoading: false,
    error: null,

    fetchAttachments: async (id = 0) => {
      set({ attachmentsLoading: true, error: null });

      try {
        const response = await GET(
          rentify_endpoints?.rentify?.affiliates?.getAttachements(id)
        );

        console.log("affiliate attachemnt response in store")
        console.log(response)

        if (response?.status === 200) {
          set({
            attachments: response?.data,
            attachmentsLoading: false,
          });
        } else {
          toast.error("An error occurred while fetching data.");
        }
      } catch (err) {
        set({
          error: "Failed to fetch data",
          attachmentsLoading: false,
        });
      }
    },

    // Get single record
    getAttachment: (id) => get().attachments.find((r) => r?.id === id) || null,

    // Add new attachment
    saveAttachment: (data) => {
      try {
        // ======= API CALL (commented for now) =======
        // await POST_JSON(endpoints?.attachments?.add, data);

        set((state) => ({
          attachments: [...state.attachments, data],
        }));
      } catch (err) {
        console.log(err);
      }
    },

    // Update attachment
    updateAttachment: (data) => {
      try {
        // ======= API CALL (commented for now) =======
        // await POST_JSON(endpoints?.attachments?.update(data.id), data);

        set((state) => ({
          attachments: state.attachments.map((r) =>
            r?.id === data?.id ? { ...r, ...data } : r
          ),
        }));
      } catch (err) {
        console.log(err);
      }
    },

    // Delete attachment
    deleteAttachment: async (id) => {
      try {
        // ======= API CALL (commented for now) =======
        // const response = await GET(endpoints?.attachments?.delete(id));
        // handleStatusCode(response);
        // if (response?.status !== 200) {
        //   throw new Error(response?.message);
        // }

        const record = get().getAttachment(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          attachments: state.attachments.filter((r) => r?.id !== id),
          attachmentsLoading: false,
          error: null,
        }));
      } catch (err) {
        console.log(err);
      }
    },
  }),
  {
    name: "attachments-store", // localStorage key
  }
  //)
);

const useViewTabsStore = create((set, get) => ({
  tabs: [],
  activeTab: "vehicle_list",

  setTabs: (tabs) => set({ tabs }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addTab: (tab) => {
    const { tabs } = get();
    if (tabs.find((t) => t.value === tab.value)) {
      set({ activeTab: tab.value });
      return true;
    }
    if (tabs.length >= MAX_TABS) {
      console.warn(`Max ${MAX_TABS} tabs allowed`);
      return false;
    }
    set({ tabs: [...tabs, tab], activeTab: tab.value });
    return true;
  },

  removeTab: (value) => {
    if (value !== "vehicle_list") {
      const { tabs, activeTab } = get();
      const updatedTabs = tabs.filter((t) => t.value !== value);
      let newActive = activeTab;
      if (activeTab === value && updatedTabs.length > 0) {
        newActive = updatedTabs[0].value;
      }
      set({ tabs: updatedTabs, activeTab: newActive });
    }
  },

  getMaxTabs: () => MAX_TABS,
}));

const useFiltersStore = create((set, get) => ({
  filters: [],
  activeFilter: null,
  values: {
    booking_id: null,
    booking_date: null,
    client_id: null,
    vehicle_id: null,
    rental_period: null,
    rent_per_day: null,
    payment_status_id: null,
    security_deposit: null,
    security_payment: null,
    booking_status_id: null,
  },

  setFilters: (filters) => set({ filters }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  addFilter: (filter) => {
    const { filters } = get();
    if (filters.find((f) => f.value === filter.value)) {
      set({ activeFilter: filter.value });
      return true;
    }
    if (filters.length >= MAX_FILTERS) {
      console.warn(`Max ${MAX_FILTERS} filters allowed`);
      return false;
    }
    set({ filters: [...filters, filter], activeFilter: filter.value });
    return true;
  },

  removeFilter: (value) => {
    const { filters, activeFilter, values } = get();
    const updatedFilters = filters.filter((f) => f.value !== value);

    // also clear value from payload
    const updatedValues = {
      ...values,
      [value]: Array.isArray(values[value]) ? [] : null,
    };

    let newActive = activeFilter;
    if (activeFilter === value && updatedFilters.length > 0) {
      newActive = updatedFilters[0].value;
    }
    set({
      filters: updatedFilters,
      activeFilter: newActive,
      values: updatedValues,
    });
  },

  updateValue: (key, val) => {
    const { values } = get();
    set({ values: { ...values, [key]: val } });
  },

  getPayload: () => get().values,

  getMaxFilters: () => MAX_FILTERS,
}));

export {
  useViewTabsStore,
  useFiltersStore,
  useNotesStore,
  useAttachementsViewTabsStore,
  useAttachmentsStore,
  useAffiliateTabsStore,
};

const useAffiliateStore = create(
  //persist(
  (set, get) => ({
    affiliate: [],
    affiliateLoading: false,

    bookingHistory: [],
    bookingHistoryLoading: false,

    bookingHistoryPayload: null,

    error: null,

    page: 1,
    pages: 0,
    limit: 20,

    setPage: (n) => set({ page: n }),

    fetchAffiliate: async (id = 0) => {
      //if (get().affiliate?.id === id) return;
      set({ affiliateLoading: true, error: null });

      try {
        const response = await GET(
          rentify_endpoints?.rentify?.affiliates?.getDetails(id)
        );

        console.log("single affiliate response");
        console.log(response);

        if (response?.status === 200) {
          set({
            affiliate: response?.data,
            affiliateLoading: false,
          });
        } else {
          toast.error("An error occurred while fetching the Call.");
        }
      } catch (err) {
        set({
          error: "Failed to fetch vehicles",
          affiliateLoading: false,
        });
      }
    },

    fetchBookingHistory: async (body = {}) => {
      set({ bookingHistoryLoading: true });

      try {
        const response = await POST(
          rentify_endpoints?.rentify?.affiliates?.getBookingHistory,
          body
        );

        console.log("filter fetch response response 405");
        console.log(response);

        //console.log(rentify_endpoints?.rentify?.affiliates?.getBookingHistory); console.log(" payload fetchBookingHistory 405", response); console.log("fetchBookingHistory 405", response);

        if (response?.status === 200) {
          set({
            page: 1,
            bookingHistory: response?.data,
            bookingHistoryLoading: false,
          });
        } else {
          toast.error("An error occurred while fetching the Call.");
        }
      } catch (err) {
        console.log("err 417");
        console.log(err);

        set({
          error: "Failed to fetch booking history",
          bookingHistoryLoading: false,
        });
      }
    },

    fetchBookingHistoryPayload: async (id = 0) => {
      try {
        const response = await GET(
          rentify_endpoints?.rentify?.affiliates?.getBookingHistoryPayload(id)
        );

        console.log("payload response 428");
        console.log(response);

        if (response?.status === 200) {
          set({
            bookingHistoryPayload: response?.data,
          });
        } else {
          toast.error("An error occurred while fetching the Call.");
        }
      } catch (err) {
        set({
          error: "Failed to fetch vehicles",
        });
      }
    },
  }),
  {
    name: "affiliate-store", // localStorage key
  }
  //)
);

export default useAffiliateStore;
