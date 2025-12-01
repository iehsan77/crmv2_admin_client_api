"use client";

import Image from "next/image";

export default function NoteItem({ item }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full overflow-hidden">
        <Image
          src={item?.avatar}
          alt={item?.user}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
      </div>
      <div className="flex flex-col">
        <p className="text-sm text-gray-900">{item?.note}</p>
        <span className="text-xs text-gray-500">
          {item?.role} – {item?.user} – {item?.date} – {item?.company}
        </span>
      </div>
    </div>
  );
}
