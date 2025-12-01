"use client";

import { Card, CardContent } from "@/components/ui/card";
import NoteItem from "./NoteItem";

import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import { Plus } from "lucide-react";
import NoteForm from "./NoteForm";

import RecordNotFound from "@/components/RecordNotFound";

export default function List({ records = {} }) {

  const { showDrawer } = useDrawer();
  return (
    <Card className="rounded-lg shadow-sm">
      <CardContent>
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

        {records?.length ? (
          <div className="mt-4 space-y-4">
            {records?.map((record) => (
              <NoteItem key={record.id} record={record} />
            ))}
          </div>
        ) : (
          <RecordNotFound />
        )}
      </CardContent>
    </Card>
  );
}
