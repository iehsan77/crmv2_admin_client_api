"use client";

import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import { Plus } from "lucide-react";
import NoteForm from "./NoteForm";

export default function NotesHeader() {
  const { showDrawer } = useDrawer();
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-medium text-gray-900">Notes</h2>
      <Button
        onClick={() =>
          showDrawer({
            title: "Add Note",
            size: "xl",
            content: <NoteForm />,
          })
        }
      >
        <Plus className="w-4 h-4 mr-1" />
        Add
      </Button>
    </div>
  );
}
