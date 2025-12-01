"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";

import { useCustomerTabsStore } from "@/stores/customers/useCustomersStore";

export default function LeftSidebarActions({ record }) {
  const { setSelectedTab } = useCustomerTabsStore();

  return (
    <div className="flex justify-evenly gap-0 pb-3">
      {/* Note (static) */}
      <div
        key={1}
        className="flex flex-col items-center text-muted-foreground cursor-pointer hover:text-primary"
        onClick={() => setSelectedTab("Activity / Timelines")}
      >
        <div className="bg-white w-8 h-8 flex items-center justify-center border rounded-full mb-1">
          <Icon icon="lucide:file-text" className="h-4 w-4" />
        </div>
        <span className="text-sm text-primary">Note</span>
      </div>

      {/* Email */}
      <Link
        key={2}
        href={`mailto:${record?.email}`}
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
        href={`tel:${record?.phone}`}
        className="flex flex-col items-center text-muted-foreground hover:text-primary"
      >
        <div className="bg-white w-8 h-8 flex items-center justify-center border rounded-full mb-1">
          <Icon icon="lucide:phone" className="h-4 w-4" />
        </div>
        <span className="text-sm text-primary">Call</span>
      </Link>

      {/* Task */}
      <Link
        key={4}
        href={`#tasks`}
        className="flex flex-col items-center text-muted-foreground hover:text-primary"
      >
        <div className="bg-white w-8 h-8 flex items-center justify-center border rounded-full mb-1">
          <Icon icon="lucide:notebook-text" className="h-4 w-4" />
        </div>
        <span className="text-sm text-primary">Task</span>
      </Link>

      {/* Meeting */}
      <Link
        key={5}
        href={`#meetings`}
        className="flex flex-col items-center text-muted-foreground hover:text-primary"
      >
        <div className="bg-white w-8 h-8 flex items-center justify-center border rounded-full mb-1">
          <Icon icon="lucide:calendar-days" className="h-4 w-4" />
        </div>
        <span className="text-sm text-primary">Meeting</span>
      </Link>
    </div>
  );
}
