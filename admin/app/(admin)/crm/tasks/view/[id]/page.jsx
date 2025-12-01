"use client";
import React from "react";
import { cn } from "@/lib/utils";

import OverviewTabPage from "@/partials/crm/tasks/view/overview/OverviewTabPage";

import NotesList from "@/partials/crm/tasks/view/activity/notes/NotesList";
import TimelineList from "@/partials/crm/tasks/view/activity/timeline/TimelineList";
import AttachmentsList from "@/partials/crm/tasks/view/activity/attachments/AttachmentsList";

import { useTasksTabsStore } from "@/stores/crm/useTasksStore";

export default function Page() {
  const {
    tabs,
    selectedTab,
    setSelectedTab,
    selectedSubTab,
    setSelectedSubTab,
    getActiveSubTabs,
  } = useTasksTabsStore();

  const activeSubTabs = getActiveSubTabs();

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
            {selectedSubTab === "subTab1" && <TimelineList />}
            {selectedSubTab === "subTab2" && <NotesList />}
            {selectedSubTab === "subTab3" && <AttachmentsList />}
          </>
        )}
      </div>
    </div>
  );
}
