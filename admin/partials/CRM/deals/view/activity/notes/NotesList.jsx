"use client";

import { Card, CardContent } from "@/components/ui/card";
import NotesHeader from "./NotesHeader";
import NoteItem from "./NoteItem";

import useDealsStore from "@/stores/crm/useDealsStore";
import RecordNotFound from "@/components/RecordNotFound";

export default function List() {
  const record = useDealsStore((s) => s.recordDetails);
  return (
    <Card className="rounded-lg shadow-sm">
      <CardContent>
        <NotesHeader />
        {record?.notes?.length ? (
          <div className="mt-4 space-y-4">
            {record?.notes?.map((note) => (
              <NoteItem key={note.id} item={note} />
            ))}
          </div>
        ) : (
          <RecordNotFound />
        )}
      </CardContent>
    </Card>
  );
}
