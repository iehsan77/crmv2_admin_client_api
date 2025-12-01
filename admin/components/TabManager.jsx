"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import Button from "@/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TabManager({
  availableTabs = [],
  initialTabs = [],
  initialActive = initialTabs[0]?.key || "",
  allowClose = true,
  showAddView = true,
  onTabChange,
  onTabAdd,
  onTabRemove,
}) {
  const [tabs, setTabs] = useState(initialTabs);
  const [activeTab, setActiveTab] = useState(initialActive);

  const handleTabAdd = (tab) => {
    if (!tabs.find((t) => t.key === tab.key)) {
      const newTabs = [...tabs, tab];
      setTabs(newTabs);
      setActiveTab(tab.key);
      onTabAdd?.(tab);
      onTabChange?.(tab.key);
    } else {
      setActiveTab(tab.key);
      onTabChange?.(tab.key);
    }
  };

  const handleTabRemove = (key) => {
    const updatedTabs = tabs.filter((tab) => tab.key !== key);
    setTabs(updatedTabs);
    onTabRemove?.(key);

    if (activeTab === key && updatedTabs.length > 0) {
      const nextTab = updatedTabs[0];
      setActiveTab(nextTab.key);
      onTabChange?.(nextTab.key);
    }
  };

  const isTabActive = (key) => activeTab === key;

  return (
    <div className="flex items-center justify-between border-t">
      {/* Scrollable Tabs */}
      <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-[#F5F9FF]">
        <div className="flex min-w-max w-full">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`min-w-[10rem] grow flex items-center justify-between px-4 py-3 cursor-pointer whitespace-nowrap text-sm border-x ${
                isTabActive(tab.key)
                  ? "bg-white text-black"
                  : "bg-[#F5F9FF] text-muted-foreground"
              }`}
              onClick={() => {
                setActiveTab(tab.key);
                onTabChange?.(tab.key);
              }}
            >
              <span className="truncate">{tab.label}</span>
              {allowClose && tab.key !== initialTabs[0]?.key && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTabRemove(tab.key);
                  }}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add View Button */}
      {showAddView && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-1 text-sm text-muted-foreground bg-white rounded-none ml-2"
            >
              <Plus className="w-4 h-4" />
              Add View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {availableTabs
              .filter((t) => !tabs.find((tab) => tab.key === t.key))
              .map((tab) => (
                <DropdownMenuCheckboxItem
                  key={tab.key}
                  checked={false}
                  onClick={() => handleTabAdd(tab)}
                >
                  {tab.label}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
