"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";

import { useAffiliateTabsStore } from "@/stores/rentify/affiliates/useAffiliateStore";

export default function ProfileActions({ affiliate }) {
  const { setSelectedTab } = useAffiliateTabsStore();

  return (
    <div className="flex justify-evenly gap-6 pb-3">
      {/* Note (static) */}
      <div
        key={1}
        className="flex flex-col items-center text-muted-foreground cursor-pointer hover:text-primary"
        onClick={()=>setSelectedTab("Activity / Timelines")}
      >
        <div className="bg-white w-8 h-8 flex items-center justify-center border rounded-full mb-1">
          <Icon icon="lucide:file-text" className="h-4 w-4" />
        </div>
        <span className="text-sm text-primary">Note</span>
      </div>

      {/* Email */}
      <Link
        key={2}
        href={`mailto:${affiliate?.email}`}
        className="flex flex-col items-center text-muted-foreground hover:text-primary"
      >
        <div className="bg-white w-8 h-8 flex items-center justify-center border rounded-full mb-1">
          <Icon icon="lucide:mail" className="h-4 w-4" />
        </div>
        <span className="text-sm text-primary">Email</span>
      </Link>

      {/* Call */}
      <Link
        key={3}
        href={`tel:${affiliate?.phone}`}
        className="flex flex-col items-center text-muted-foreground hover:text-primary"
      >
        <div className="bg-white w-8 h-8 flex items-center justify-center border rounded-full mb-1">
          <Icon icon="lucide:phone" className="h-4 w-4" />
        </div>
        <span className="text-sm text-primary">Call</span>
      </Link>
    </div>
  );
}
