import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useTenantStore = create(
  persist(
    (set, get) => ({
      vendor: {
        id: 1,
        vendor_website_id: 1,
      },
      loading: false,
      setVendor: (vendorData) => set({ vendor: vendorData }),
      setLoading: (loading) => set({ loading }),
      setVendor_websiteID: async (id) => {
        set((state) => ({ vendor: { ...state?.vendor, vendor_website_id: id } }));
      },
    }),
    {
      name: "vendor-store", // key for localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useTenantStore;
