"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import NotesHeader from "./NotesHeader";
import NoteItem from "./NoteItem";

import { useParams } from "next/navigation";

import { useNotesStore } from "@/stores/rentify/affiliates/useAffiliateStore";

export default function NotesCard() {
  const { id } = useParams();
  const { notes, fetchNotes, notesLoading } = useNotesStore();


  useEffect(() => {
    if (id) {
      fetchNotes(id);
    }
  }, [id, fetchNotes]);

  return (
    <Card className="rounded-lg shadow-sm">
      <CardContent>
        <NotesHeader />
        <div className="mt-4 space-y-4">
          {notes.length>0 ? notes.map((note) => (
            <NoteItem key={note.id} item={note} />
          )) : (<div>Sorry! no notes available.</div>)}
        </div>
      </CardContent>
    </Card>
  );
}
