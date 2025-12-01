"use client";
import React from "react";
import { cn } from "@/lib/utils";

import OverviewTabPage from "@/partials/crm/contacts/view/overview/OverviewTabPage";

import TimelineList from "@/partials/crm/common/timeline/TimelineList";
import NotesList from "@/partials/crm/common/notes/NotesList";
//import AttachmentsList from "@/partials/crm/common/attachments/AttachmentsList";
import RelatedTasksList from "@/partials/crm/common/tasks/RelatedTasksList";
import RelatedMeetingsList from "@/partials/crm/common/meetings/RelatedMeetingsList";

import RelatedCallsList from "@/partials/crm/common/calls/RelatedCallsList";


import useLeadsStore, { useLeadsTabsStore } from "@/stores/crm/useLeadsStore";

export default function Page() {
  const {
    tabs,
    selectedTab,
    setSelectedTab,
    selectedSubTab,
    setSelectedSubTab,
    getActiveSubTabs,
  } = useLeadsTabsStore();

  const activeSubTabs = getActiveSubTabs();
  
  const record = useLeadsStore((s) => s.recordDetails);

  return (
    <div className="space-y-4">
      {/* ==== Main Tabs ==== */}
      <div className="flex">
        {tabs.map((tab, i) => (
          <>
            <button
              key={tab.key}
              className={cn(
                "flex-1 py-2 px-4 bg-[#F9FCFF] text-gray-800 border border-[#D4E7F7]",
                tab.key === selectedTab
                  ? "border-primary font-semibold shadow-md"
                  : "font-medium hover:bg-[#E1F0FF]",
                i === 0 ? "rounded-tl-lg" : "",
                i === tabs?.length - 1 ? "rounded-tr-lg" : ""
              )}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.title}
            </button>
          </>
        ))}
      </div>

      {/* ==== Content ==== */}
      <div>
        {selectedTab === "tab1" && <OverviewTabPage />}

        {selectedTab === "tab2" && (
          <>
            {/* ==== Activity Sub Tabs ==== */}
            <div className="flex mb-4 border-b">
              {activeSubTabs.map((sub) => (
                <button
                  key={sub.key}
                  className={cn(
                    "py-2 px-4 border-b-2",
                    sub.key === selectedSubTab
                      ? "border-primary font-semibold text-primary"
                      : "border-transparent text-gray-600 hover:text-primary"
                  )}
                  onClick={() => setSelectedSubTab(sub.key)}
                >
                  {sub.title}
                </button>
              ))}
            </div>

            {/* ==== Sub Tab Content ==== */}
            {selectedSubTab === "subTab1" && <TimelineList records={record?.activity_log} />}
            {selectedSubTab === "subTab2" && <NotesList records={record?.notes} />}
            {selectedSubTab === "subTab3" && <RelatedTasksList records={record?.tasks} />}
            {selectedSubTab === "subTab4" && <RelatedMeetingsList records={record?.meetings} />}
            {selectedSubTab === "subTab5" && <RelatedCallsList records={record?.calls} />}
          </>
        )}
      </div>
    </div>
  );
}
