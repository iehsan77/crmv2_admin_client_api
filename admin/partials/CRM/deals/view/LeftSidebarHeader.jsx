"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export default function LeftSidebarHeader({ record = [] }) {
  return (
    <div className="flex flex-col items-center relative p-4">
      {/* Actions Menu */}
      <Button variant="ghost" size="icon" className="absolute top-2 right-2">
        <MoreHorizontal className="h-5 w-5" />
      </Button>
      {/* 
      <Avatar className="w-20 h-20 border-2 border-blue-500">
        {record?.img ? (
          <AvatarImage src={record.img} alt={record.title || "Avatar"} />
        ) : (
          <AvatarFallback>
            {(record?.title || "N/A")
              .split(" ")
              .map((word) => word.charAt(0))
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
       */}

      {/* Name */}
      <h2 className="mt-2 font-semibold text-lg">{record?.title}</h2>
      <h2 className="mt-2 font-semibold text-lg">AED {record?.amount}</h2>
    </div>
  );
}
