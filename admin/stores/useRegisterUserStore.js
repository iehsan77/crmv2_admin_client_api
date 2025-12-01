import { create } from "zustand";
import { persist } from "zustand/middleware";

const useRegisterUserStore = create(
  persist(
    (set, get) => ({
      newUserData: {},

      // Merge new data with existing
      setNewUserData: (userData) =>
        set({ newUserData: { ...get().newUserData, ...userData } }),

      clearUser: () => set({ newUserData: {} }),
    }),
    {
      name: "registrationForm", // localStorage key
    }
  )
);

export default useRegisterUserStore;
