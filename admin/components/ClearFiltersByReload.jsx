"use client";

import { Eraser } from "lucide-react";
import Button from "./Button";

export default function ClearFiltersByReload({ text = false }) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleReload}
      className="flex items-center gap-1"
    >
      {text && <span>Reset</span>}
      <Eraser size={16} />
    </Button>
  );
}
