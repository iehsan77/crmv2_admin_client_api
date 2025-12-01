"use client";
import { create } from "zustand";
import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

// 📦 Utility to build hierarchy from roles list
function buildHierarchy(roles) {
  const roleMap = {};

  const cleanRoles = roles
    .filter((role) => !role.deleted) // Exclude deleted roles
    .map((role) => ({
      id: role.id,
      title: role.title,
      report_to_id: role.report_to_id ? Number(role.report_to_id) : null,
      report_to: role.report_to ?? null,
      excerpt: role.excerpt || "",
      active: role.active,
      children: [],
    }));

  cleanRoles.forEach((role) => {
    roleMap[role.id] = role;
  });

  const tree = [];
  cleanRoles.forEach((role) => {
    if (role.report_to_id && roleMap[role.report_to_id]) {
      roleMap[role.report_to_id].children.push(role);
    } else {
      tree.push(role);
    }
  });

  return tree;
}

const removeRoleFromTree = (tree, roleId) => {
  return tree
    .map((node) => {
      if (node.id === roleId) return null;
      if (node.children) {
        node.children = removeRoleFromTree(node.children, roleId);
      }
      return node;
    })
    .filter(Boolean);
};

const useRolesStore = create((set, get) => ({
  roles: [],
  rolesHasFetched: false,
  rolesLoading: false,
  error: null,
  selectedRole: null,
  reportTo: 0,
  rolesHierarchy: [],

  fetchRoles: async () => {
    if (get().rolesHasFetched) return;

    set({ rolesLoading: true, error: null });

    try {
      const response = await POST(crm_endpoints?.settings?.roles?.get);
      if (response?.status === 200) {
        const fetchedRoles = response?.data ?? [];

        set({
          roles: fetchedRoles,
          rolesHasFetched: fetchedRoles.length > 0,
          rolesLoading: false,
          rolesHierarchy: buildHierarchy(fetchedRoles),
        });
      } else {
        handleResponse(response);
        throw new Error(response?.message || "Fetch failed");
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      set({ error: "Failed to fetch roles", rolesLoading: false });
    }
  },

  getRole: (id) => get().roles.find((r) => r?.id === id) || null,

  deleteRoleFromHierarchy: (id) =>
    set((state) => ({
      rolesHierarchy: removeRoleFromTree(state.rolesHierarchy, id),
    })),

  saveRole: (data) => {
    const exists = get().roles.some((r) => r.id === data.id);
    if (exists) {
      toast.error("Role already exists");
      return;
    }

    toast.success("New role added");
    const newRoles = [...get().roles, data];

    set({
      roles: newRoles,
      rolesHierarchy: buildHierarchy(newRoles),
    });
  },

  updateRole: (data) => {
    toast.success("Role updated");

    const updatedRoles = get().roles.map((r) =>
      r?.id === data?.id ? { ...r, ...data } : r
    );

    set({
      roles: updatedRoles,
      rolesHierarchy: buildHierarchy(updatedRoles),
    });
  },

  deleteRole: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.roles?.delete(id));
      if (response?.status === 200) {
        const updatedRoles = get().roles.map((r) =>
          r?.id === id ? { ...r, deleted: 1 } : r
        );

        set({
          roles: updatedRoles,
          rolesHierarchy: buildHierarchy(updatedRoles),
          rolesLoading: false,
          error: null,
        });

        toast.success(response?.message || "Role deleted");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  },

  restoreRole: async (id) => {
    try {
      const response = await GET(crm_endpoints?.settings?.roles?.restore(id));
      if (response?.status === 200) {
        const updatedRoles = get().roles.map((r) =>
          r?.id === id ? { ...r, deleted: 0 } : r
        );

        set({
          roles: updatedRoles,
          rolesHierarchy: buildHierarchy(updatedRoles),
          rolesLoading: false,
          error: null,
        });

        toast.success("Role restored");
      } else {
        handleResponse(response);
        throw new Error(response?.message);
      }
    } catch (err) {
      toast.error(err?.message || "Restore failed");
    }
  },

  setSelectedRole: (record) => set({ selectedRole: record }),
  clearSelectedRole: () => set({ selectedRole: null }),
  setReportTo: (id) => set({ reportTo: id }),

  resetRoles: () =>
    set({
      roles: [],
      rolesHasFetched: false,
      rolesLoading: false,
      error: null,
      selectedRole: null,
      reportTo: 0,
      rolesHierarchy: [],
    }),
}));

export default useRolesStore;
