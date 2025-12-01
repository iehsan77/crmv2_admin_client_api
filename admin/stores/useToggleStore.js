
import { create } from "zustand";
const useToggleStore = create((set) => ({
  isOpen: false,
  message: "",
  onConfirm: null,

  open: (message = "", onConfirm = null) =>
    set((state) => ({ ...state, isOpen: true, message, onConfirm })),

  setOpen: (status) => set((state) => ({ ...state, isOpen: status })),

  close: () =>
    set((state) => ({ ...state, isOpen: false, message: "", onConfirm: null })),

  setMessage: (message) => set((state) => ({ ...state, message })),

  setOnConfirm: (fn) => set((state) => ({ ...state, onConfirm: fn })),
}));

export default useToggleStore;

