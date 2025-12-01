import { create } from "zustand";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import toast from "react-hot-toast";
import createAssociationStore from "../factories/createAssociationStore";

const MAX_TABS = 6;
const MAX_FILTERS = 5;

// 🔹 Association Store
export const useBookingsAssociationStore = createAssociationStore();

// ---------- Tabs Store ----------
export const useBookingsViewTabsStore = create((set, get) => ({
  tabs: [],
  activeTab: null,
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
    if (value !== "all_bookings") {
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

// ---------- Filters Store ----------
/*
export const useBookingsFiltersStore = create((set, get) => ({
  filters: [],
  activeFilter: null,
  values: {
    booking_id: "",
    booking_status_id: "",
    booking_date: "",
    last_activity: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    model_id: "",
    body_type_id: "",
    rent_price: "",
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


      // ✅ New Booking fields
      booking_id: filterFormValues?.booking_id ?? "",
      booking_status_id: filterFormValues?.booking_status_id?.value ?? "",
      booking_date: filterFormValues?.booking_date ?? "",
      last_activity: filterFormValues?.last_activity?.value ?? "",

      // ✅ Client fields
      client_name: filterFormValues?.client_name ?? "",
      client_phone: filterFormValues?.client_phone ?? "",
      client_email: filterFormValues?.client_email ?? "",

      // ✅ Vehicle fields
      model_id: filterFormValues?.model_id ?? "",
      body_type_id: filterFormValues?.body_type_id ?? "",

      // ✅ Rental Fee
      rent_price: filterFormValues?.rent_price ?? "",

*/
const initialValues = {
  booking_uid: "",
  booking_status_id: "",
  pickup_time: "",
  last_activity: "",
  client_name: "",
  client_phone: "",
  client_email: "",
  model_id: "",
  body_type_id: "",
  rent_price: "",
};

export const useBookingsFiltersStore = create((set, get) => ({
  filters: [],
  activeFilter: null,
  values: { ...initialValues },

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

  // ✅ Added resetFilters method
  resetFilters: () =>
    set((state) => ({
      filters: state.filters,
      activeFilter: state.activeFilter,
      values: { ...initialValues },
    })),
}));

// ---------- Bookings Statistics Store ----------
const fetchData = async (
  endpoint,
  params = {},
  setter,
  fallbackMessage,
  signal
) => {
  try {
    const response = await POST(endpoint, params, { signal });

    if (response?.status === 200) {
      setter(response?.data);
    } else {
      toast.error(response?.message || fallbackMessage);
    }
  } catch (err) {
    if (err.name !== "AbortError") console.error(err);
  }
};
const currentDate = new Date();

export const useBookingsStatisticsStore = create((set) => ({
  statistics: {
    dashboard_view: null,
    key_metrics: null,
  },
  statisticsLoading: true,

  bookingsStatus: null,
  bookingsStatusLoading: true,

  error: null,

  fetchBookingsStatistics: async (
    range = { from: currentDate, to: currentDate }
  ) => {
    const controller = new AbortController();

    set({
      statisticsLoading: true,
      bookingsStatusLoading: true,
      error: null,
    });

    try {
      await Promise.all([
        fetchData(
          rentify_endpoints?.rentify?.bookings?.getStatistics,
          { from: range.from.toISOString(), to: range.to.toISOString() },
          (data) => set({ statistics: data }),
          "Failed to fetch overview stats",
          controller.signal
        ),
        fetchData(
          rentify_endpoints?.rentify?.bookings?.getBookingsStatus,
          { from: range.from.toISOString(), to: range.to.toISOString() },
          (data) => set({ bookingsStatus: data }),
          "Failed to fetch booking status",
          controller.signal
        ),
      ]);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
        set({ error: "Failed to fetch bookings" });
      }
    } finally {
      set({
        statisticsLoading: false,
        bookingsStatusLoading: false,
      });
    }

    return () => controller.abort();
  },
}));

// ---------- Bookings Store ----------
const useBookingsStore = create((set, get) => ({
  bookings: [],
  booking: [],
  bookingsLoading: false,
  error: null,
  counter: 0,

  page: 1,
  pages: 0,
  limit: 20,

  setPage: (n) => set({ page: n }),

  filteredBookings: [],
  setFilteredBookings: async (body = {}) => {
    set({ bookingsLoading: true, error: null });

    try {
      const response = await POST(
        rentify_endpoints?.rentify?.bookings?.get,
        body
      );

      if (response?.status === 200) {
        set({
          filteredBookings: response?.data,
          bookingsLoading: false,
        });
      } else {
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      set({
        error: "Failed to fetch bookings",
        bookingsLoading: false,
      });
    }
  },

  setBookings: (records) => set({ bookings: records }),

/* 
  fetchBookings: async (body = {}, force = false) => {
    if (!force) {
      if (get().bookings?.length) return;
    }

    try {
      set({ bookingsLoading: true, error: null });
      const response = await POST(
        rentify_endpoints?.rentify?.bookings?.get,
        body
      );
      
      console.log("bookings response 159");
      console.log(response);

      if (response?.status === 200) {
        set({
          bookings: response?.data,
          page: 1,
          counter: Array.isArray(response?.data)
            ? response.data.length
            : response?.data?.target_module_ids_details?.length || 0,
          bookingsLoading: false,
        });
      } else {
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      set({
        error: "Failed to fetch bookings",
        bookingsLoading: false,
      });
    }
  },
*/

fetchBookings: async (force = false) => {
  const { getPayload } = useBookingsFiltersStore.getState();
  const { activeTab } = useBookingsViewTabsStore.getState();

  // 🔥 Construct payload automatically
  const rawPayload = getPayload();
  const payload = {
    view: activeTab || "all_bookings",
    ...Object.fromEntries(
      Object.entries(rawPayload).map(([key, val]) => [
        key,
        typeof val === "object" && val !== null && "value" in val ? val.value : val ?? "",
      ])
    ),
  };

  //if (!force && get().bookings?.length) return;

  try {
    set({ bookingsLoading: true, error: null });
    const response = await POST(
      rentify_endpoints?.rentify?.bookings?.get,
      payload
    );

    if (response?.status === 200) {
      set({
        bookings: response?.data,
        page: 1,
        counter: Array.isArray(response?.data)
          ? response.data.length
          : response?.data?.target_module_ids_details?.length || 0,
        bookingsLoading: false,
      });
    } else {
      throw new Error(response?.message || "Fetch failed");
    }
  } catch (err) {
    set({
      error: "Failed to fetch bookings",
      bookingsLoading: false,
    });
  }
},



  
  getBooking: (id) => get().bookings.find((r) => r?.id === id) || null,

  saveBooking: (record) => {
    try {
      set((state) => ({
        bookings: [record, ...state.bookings],
      }));
    } catch (err) {
      console.error(err);
    }
  },

  updateBooking: (record) => {
    try {
      set((state) => ({
        bookings: state.bookings.map((r) =>
          r?.id === record?.id ? { ...r, ...record } : r
        ),
      }));
    } catch (err) {
      console.log(err);
    }
  },

  deleteBooking: async (id) => {
    try {
      const record = get().getBooking(id);
      if (!record) throw new Error("Record not found");

      set((state) => ({
        bookings: state.bookings.filter((r) => r?.id !== id),
        bookingsLoading: false,
        error: null,
      }));
    } catch (err) {
      console.log(err);
    }
  },
}));

export default useBookingsStore;
