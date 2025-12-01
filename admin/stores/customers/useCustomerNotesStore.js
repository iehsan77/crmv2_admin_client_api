"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
 import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { GET } from "@/helper/ServerSideActions";

const useCustomerNotesStore = create(
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
        console.log("customer notes response");
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

export default useCustomerNotesStore;