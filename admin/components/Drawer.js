"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";

export default function Drawer({
  isOpen,
  onClose,
  title,
  size = "md",
  content,
  footer,
  zIndex,
}) {
  // Responsive width sizes
  const responsiveSizes = {
    sm: "w-[85vw] sm:w-[300px] md:w-[350px]",
    md: "w-[90vw] sm:w-[350px] md:w-[450px] lg:w-[500px]",
    lg: "w-[95vw] sm:w-[400px] md:w-[550px] lg:w-[650px] xl:w-[700px]",
    xl: "w-[95vw] sm:w-[450px] md:w-[600px] lg:w-[768px]",
    full: "w-screen",
  };

  return (
    <Sheet open={isOpen} 
    // onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent
        aria-describedby={undefined}
        side="right"
        className={clsx(
          "flex flex-col p-0 border-l-0 shadow-xl bg-[#F9FCFF] transition-all duration-300",
          responsiveSizes[size]
        )}
        style={{ zIndex }}
      >
        {/* Header */}
        <SheetHeader className="bg-[#D4E7F7] py-4 px-6 flex flex-row items-center justify-start border-b gap-4">
          {/* <SheetTrigger> */}
            <ArrowLeft onClick={()=>onClose()} className="w-6 h-6 cursor-pointer" />
          {/* </SheetTrigger> */}
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 px-6">{content}</div>

        {/* Footer */}
        {footer && <div className="py-4 px-6 border-t">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
