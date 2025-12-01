"use client";
import { GET } from "@/helper/ServerSideActions";
import { ecom_endpoints } from "@/utils/ecom_endpoints";
import {
  getLocalStorageData,
  setLocalStorageData,
} from "@/utils/localstorageutils";
import { create } from "zustand";

const useBrandStore = create((set) => ({
  brands: [],
  totalRecords: 0,
  limit: 10,
  loading: false,
  currentBrand: null,
  selectedBrand: {},

  setTotalRecords: (total) => set({ totalRecords: total }),

  startLoading: () => set({ loading: true }),
  stopLoading: () => set({ loading: false }),

  setBrands: (brands) => set({ brands }),

  setCurrentBrand: async (data) => {
    await setLocalStorageData("brand", data);
    set(() => ({ currentBrand: data }));
  },

  setSelectedBrand: async (data) => {
    await setLocalStorageData("selected-brand", data);
    set(() => ({ selectedBrand: data }));
  },

  fetchBrands: async (vendorId) => {
    set({ loading: true });
    try {
      const res = await GET(ecom_endpoints?.brands.getByVendorId(vendorId));

      // Multiple dummy brands
      const dummyBrands = [
        { id: 1, company_name: "Mum Love" },
        { id: 2, company_name: "Elegance" },
        { id: 3, company_name: "Glamora" },
        { id: 4, company_name: "Wear Aura" },
      ];

      const responseData = res?.data?.length ? res?.data : dummyBrands;

      const brand = await getLocalStorageData("brand");
      const selected_brand = await getLocalStorageData("selected-brand");

      if (!brand) {
        await setLocalStorageData("brand", responseData[0]);
      }
      if (!selected_brand) {
        await setLocalStorageData("selected-brand", {
          label: responseData[0]?.company_name,
          value: responseData[0]?.id,
        });
      }

      set(() => ({
        brands: responseData,
        totalRecords: res?.total_records || responseData.length,
        currentBrand: brand || responseData[0],
        selectedBrand: selected_brand || {
          label: responseData[0]?.company_name,
          value: responseData[0]?.id,
        },
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching brands:", error);
      set({ loading: false });
    }
  },
}));

export default useBrandStore;
