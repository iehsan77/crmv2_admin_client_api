"use client";

import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import { Plus, Link } from "lucide-react";

import AttachmentAddEditForm from "./AttachmentForm";

export default function CardActions() {
  const { showDrawer } = useDrawer();

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() =>
          showDrawer({
            title: "Add Attachment",
            size: "xl",
            content: <AttachmentAddEditForm />,
          })
        }
        size="sm"
      >
        <Plus />
        Add
      </Button>
    </div>
  );
}
