"use client";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Button from "@/components/Button";
import { ChevronDown } from "lucide-react";

import useCommonStore from "@/stores/useCommonStore";

export default function ViewModeSwitcher() {
  const { viewMode, setViewMode, viewOptions } = useCommonStore();

  const selectedView = viewOptions.find((v) => v.value === viewMode);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {selectedView?.icon && <selectedView.icon className="w-4 h-4" />}
          {selectedView?.label}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-40">
        <DropdownMenuRadioGroup
          value={viewMode}
          onValueChange={(value) => setViewMode(value)}
        >
          {viewOptions.map((opt) => (
            <DropdownMenuRadioItem
              key={opt.value}
              value={opt.value}
              className="flex items-center gap-2"
            >
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
