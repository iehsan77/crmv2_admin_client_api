/*
import { create } from "zustand";
import { persist } from "zustand/middleware";
const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      setUser: (userData) => set({ user: userData }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "user", // localStorage key
    }
  )
);
export default useUserStore;
*/
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      users: null,
      userModulesUrls: [],

      userRoles: [
        { value: "super_admin", label: "Super Admin" },
        { value: "admin", label: "Admin" },
        { value: "manager", label: "Manager" },
        { value: "team_lead", label: "Team Lead" },
        { value: "sales_executive", label: "Sales Executive" },
        { value: "marketing_executive", label: "Marketing Executive" },
        { value: "support_agent", label: "Support Agent" },
        { value: "accountant", label: "Accountant" },
        { value: "hr", label: "HR" },
        { value: "developer", label: "Developer" },
        { value: "client", label: "Client" },
        { value: "vendor", label: "Vendor" },
        { value: "guest", label: "Guest" },
      ],

      setUser: (userData) => set({ user: userData }),
      clearUser: () => set({ user: null }),

      getUserApps: () => {
        const user = get().user;
        const userApps = user?.apps ?? [];
        return Array.isArray(userApps) ? userApps : [userApps];
      },

      getCurrentAppBySlug: (slug) => {
        const apps = get().getUserApps();
        return apps.find((app) => app?.slug === slug);
      },

      getModulesByAppId: (appId) => {
        const apps = get().getUserApps();
        return apps.find((app) => app?.id === appId)?.modules;
      },

      getCurrentModuleBySlug: (appSlug, moduleSlug) => {
        const app = get().getCurrentAppBySlug(appSlug);
        return app?.modules?.find((module) => module?.slug === moduleSlug);
      },

      setUserModulesUrls: (record) => set({ userModulesUrls: record }),
      getUserModuleUrl: (key) => {
        const moduleUrls = get().userModulesUrls;
        return moduleUrls?.[key];
      },
      can: (key) => {
        const user = get().user;
        if (!key) return false;
        if (user?.role > 1) {
          const permissions = user?.permissions ?? [];
          return permissions.includes(key);
        }
        return true;
      },
    }),
    {
      name: "user", // localStorage key
    }
  )
);

export default useUserStore;
