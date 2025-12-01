"use client";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

import NotesCard from "@/partials/customers/profile/activity/notes/NotesCard";
import CustomerOverview from "@/partials/customers/profile/overview/CustomerOverview";
import Attachements from "@/partials/customers/profile/activity/attachements/Attachements";

// ✅ confirm if this is named export
import useCustomerStore, {
  useAttachmentsStore,
  useCustomerTabsStore,
} from "@/stores/customers/useCustomersStore"; // ✅ default export

export default function Page() {
  const { id } = useParams();

  const {
    tabs,
    selectedTab,
    setSelectedTab,
    innerTabs,
    innerSelectedTab,
    setInnerSelectedTab,
  } = useCustomerTabsStore();

  const { attachments, fetchAttachments, attachmentsLoading } =
    useAttachmentsStore();
  const { customer, fetchCustomer } = useCustomerStore();

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
      fetchAttachments(id);
    }
  }, [id, fetchCustomer, fetchAttachments]);


console.log("customer 40")
console.log(customer)

console.log("attachments 43")
console.log(attachments)



  return (
    <div className="space-y-4">
      {/* --- Top Tabs --- */}
      <div className="flex">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={cn(
              "flex-1 py-2 px-4 bg-[#F9FCFF] text-gray-800 border border-[#D4E7F7]",
              tab === selectedTab
                ? "border-primary font-semibold shadow-md"
                : "font-medium hover:bg-[#E1F0FF]",
              i === 0 && "rounded-tl-lg",
              i === tabs.length - 1 && "rounded-tr-lg"
            )}
            onClick={() => setSelectedTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- Tab Content --- */}
      <div>
        {selectedTab === "Overview" && (
          <CustomerOverview />
        )}

        {selectedTab === "Activity / Timelines" && (
          <div>
            {/* Inner Tabs */}
            <div className="flex mb-4 border-b">
              {innerTabs.map((tab) => (
                <button
                  key={tab}
                  className={cn(
                    "py-2 px-4 -mb-[1px]",
                    tab === innerSelectedTab
                      ? "border-b-2 border-primary font-semibold text-primary"
                      : "border-b-2 border-transparent font-medium text-gray-600 hover:text-gray-800"
                  )}
                  onClick={() => setInnerSelectedTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Inner Tab Content */}
            <div>
              {innerSelectedTab === "Notes" && <NotesCard />}
              {innerSelectedTab === "Attachments" && (
                <Attachements
                  attachments={attachments}
                  loading={attachmentsLoading}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
