"use client";
import { formatDateTime } from "@/helper/GeneralFunctions";
import Image from "next/image";

export default function NoteItem({ item = {} }) {
  const img = item?.user?.is_company
    ? item?.user?.logo
    : item?.user?.image;

  return (
    <div key={item?.id} className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
        {img ? (
          <Image
            src={img}
            alt="Note Author"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center text-xs text-gray-400">
            ?
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <p className="text-sm text-gray-900">{item?.content}</p>
        <span className="text-xs text-gray-500">
          {formatDateTime(item?.createdon)} by{" "}
          {item?.user?.is_company
            ? item?.user?.company_name
            : `${item?.user?.first_name || ""} ${item?.user?.last_name || ""}`}
          {item?.company && ` (${item?.company})`}
        </span>
      </div>
    </div>
  );
}
