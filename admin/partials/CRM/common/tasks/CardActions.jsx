"use client";

import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import { Plus, Link } from "lucide-react";

import Association from "./Association";
import RecordForm from "@/partials/crm/tasks/RecordForm";

import { useTasksAssociationStore } from "@/stores/crm/useTasksStore";

export default function CardActions() {
  const title = "Tasks";

  const { showDrawer } = useDrawer();

  const record = useTasksAssociationStore((s) => s.record);

  const handleAddClick = () => {
    showDrawer({
      title: `Add ${title}`,
      size: "xl",
      content: <RecordForm />,
    });
  };

  const handleLinkClick = () => {
    showDrawer({
      title: "Task Association",
      size: "xl",
      content: <Association record={record} />,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleLinkClick}
        className="bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
        size="sm"
      >
        <Link className="w-4 h-4 mr-1" /> Link
      </Button>
      <Button onClick={handleAddClick} size="sm">
        <Plus className="w-4 h-4 mr-1" /> Add
      </Button>
    </div>
  );
}
