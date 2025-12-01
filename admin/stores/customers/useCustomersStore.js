"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

const useCustomerTabsStore = create((set, get) => ({
  tabs: ["Overview", "Activity / Timelines"],
  selectedTab: "Overview",
  setSelectedTab: (tab) => set({ selectedTab: tab }),

  innerTabs: ["Notes", "Attachments"],
  innerSelectedTab: "Notes",
  setInnerSelectedTab: (innerTab) => set({ innerSelectedTab: innerTab }),
}));
export { useCustomerTabsStore };

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
          rentify_endpoints?.rentify?.customers?.getNotes(id)
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
          rentify_endpoints?.rentify?.customers?.getAttachements(id)
        );



        console.log("customer attachemnt response in store")
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
export { useNotesStore, useAttachmentsStore, useAttachementsViewTabsStore };


const useCustomersStore = create(
  //  persist(
  (set, get) => ({
    customers: [],
    customer: [],
    customerLoading: false,
    customersLoading: false,
    error: null,

    filteredCustomers: [],
    setFilteredCustomers: async (body = {}) => {
      set({ customersLoading: true, error: null });

      try {
        const response = await POST(
          rentify_endpoints?.rentify?.customers?.get,
          body
        );

        if (response?.status === 200) {
          set({
            filteredCustomers: response?.data,
            customersLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        console.log(err);
        set({
          error: "Failed to fetch body types",
          customersLoading: false,
        });
      }
    },

    fetchCustomers: async (body = {}) => {
      if (get().customers?.length) return;
      set({ customersLoading: true, error: null });

      try {
        const response = await POST(
          rentify_endpoints?.rentify?.customers?.get,
          body
        );
        if (response?.status === 200) {
          set({
            customers: response?.data,
            customersLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        console.log(err);
        set({
          error: "Failed to fetch body types",
          customersLoading: false,
        });
      }
    },

    fetchCustomer: async (id = 0) => {
      set({ customerLoading: true, error: null });

      try {
        const response = await GET(
          rentify_endpoints?.rentify?.customers?.getDetails(id)
        );

        console.log("response 99");
        console.log(response);

        if (response?.status === 200) {
          set({
            customer: response?.data,
            customerLoading: false,
          });
        } else {
          throw new Error(response?.message || "Fetch failed");
        }
      } catch (err) {
        console.log(err);
        set({
          error: "Failed to fetch body types",
          customerLoading: false,
        });
      }
    },

    getCustomer: (id) => get().customers.find((r) => r?.id === id) || null,

    //getUsedCustomers: () => get().customers.filter((r) => r?.used_id) || [],

    getUsedCustomers: () =>
      get().customers.filter((r) => {
        return r?.is_used;
      }) || [],

    saveCustomer: (record) => {
      try {
        set((state) => ({
          customers: [record, ...state.customers], // add at start
        }));
      } catch (err) {
        console.error(err);
      }
    },

    updateCustomer: (record) => {
      try {
        set((state) => ({
          customers: state.customers.map((r) =>
            r?.id === record?.id ? { ...r, ...record } : r
          ),
        }));
      } catch (err) {
        console.log(err);
      }
    },

    deleteCustomer: async (id) => {
      try {
        // ======= API CALL (commented for now) =======
        // const response = await GET(rentify_endpoints?.rentify?.customers?.delete(id));
        // handleStatusCode(response);
        // if (response?.status !== 200) {
        //   throw new Error(response?.message);
        // }

        const record = get().getCustomer(id);
        if (!record) throw new Error("Record not found");

        set((state) => ({
          customers: state.customers.filter((r) => r?.id !== id),
          customersLoading: false,
          error: null,
        }));
      } catch (err) {
        console.log(err);
      }
    },
  })
  /*
    {
      name: "rentify-body-types-store",
    }
  )
  */
);

export default useCustomersStore;
