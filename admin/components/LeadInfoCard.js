"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function LeadInfoCard({ record = {} }) {
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger className="text-[#1E3A8A] hover:underline cursor-pointer">
        {record?.name}
      </HoverCardTrigger>

      <HoverCardContent className="w-[auto]">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
            <img
              src={record?.image || "/images/image-placeholder-icon.png"}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>

          <div className="space-y-1 text-sm">
            <div className="font-semibold">
              {record?.first_name + " " + record?.last_name}
            </div>
            <div className="text-gray-500">{record?.company}</div>

            <div className="mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500 me-2">Lead Owner:</span>
                <span className="text-right">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 me-2">Email:</span>
                <span>{record?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 me-2">Phone:</span>
                <span>{record?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 me-2">Mobile:</span>
                <span>{record?.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 me-2">Lead Status:</span>
                <span>{record?.lead_staus}</span>
              </div>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
