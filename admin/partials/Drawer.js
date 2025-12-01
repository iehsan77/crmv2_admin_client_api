// components/Drawer.jsx
/*
"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Drawer({ title, children, isOpen, setIsOpen }) {
  return (
    <Sheet open={isOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          Add New
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="p-3">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
*/

"use client";

import { getRandomString } from "@/helper/GeneralFunctions";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function Drawer({ title, children, isOpen, onClose }) {
  return (
    <Sheet key={()=>getRandomString()} open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="p-3  overflow-y-auto h-screen">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
