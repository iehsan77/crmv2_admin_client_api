"use client";

import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClearFilters({ text = false, useStore, useFiltersStore }) {
  
  const resetFilters = useFiltersStore((s) => s.resetFilters);
  const fetchRecords = useStore((s) => s.fetchRecords);

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={() => {
        resetFilters();
        fetchRecords();
      }}
      className="flex items-center gap-1"
    >
      {text && <span>Reset</span>}
      <Eraser size={16} />
    </Button>
  );
}
