"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { formatDateTime, getName } from "@/helper/GeneralFunctions";
import Image from "next/image";

export default function NoteItem({ record = {} }) {
  const { user_details: user } = record;

  return (
    <div className="flex records-center gap-3">
      <div className="w-10 h-10 rounded-full overflow-hidden">
        <Avatar className="w-10 h-10 border-2 border-blue-500">
          {user?.image ? (
            <AvatarImage src={user.image} alt={getName(user) || "Avatar"}  className="w-20 h-20" />
          ) : (
            <AvatarFallback>
              {(getName(user) || "N/A")
                .split(" ")
                .map((word) => word.charAt(0))
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>

      </div>
      <div className="flex flex-col">
        <p className="text-sm text-gray-900">{record?.note}</p>
        <span className="text-xs text-gray-500">
          By: {getName(user)} – {formatDateTime(record?.createdon)}
        </span>
      </div>
    </div>
  );
}
