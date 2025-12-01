"use client";

import { useEffect } from "react";
import { X, Plus } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import { useAttachementsViewTabsStore } from "@/stores/customers/useCustomersStore";
import CheckboxInput from "@/components/FormFields/CheckboxInput";
import { Icon } from "@iconify/react";

export default function AttachmentsTabs({
  availableTabs = [],
  initialTabs = [],
  initialActive = initialTabs[0]?.value || "",
  allowClose = true,
  showAddView = true,
  onTabChange,
  tabIcon,
}) {
  const { showDrawer } = useDrawer();
  const { tabs, activeTab, setTabs, setActiveTab, removeTab } =
    useAttachementsViewTabsStore();

  // ✅ initialize only once on mount
  useEffect(() => {
    if (tabs.length === 0) {
      setTabs(initialTabs);
      setActiveTab(initialActive);
    }
  }, []);

  const isTabActive = (value) => activeTab === value;

  return (
    <div className="flex items-center justify-between border-t">
      {/* Scrollable Tabs */}
      <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-[#F5F9FF]">
        <div className="flex min-w-max w-full">
          {tabs.map((tab) => (
            <div
              key={tab.value}
              className={`min-w-[10rem] grow flex items-center justify-between px-4 py-3 cursor-pointer whitespace-nowrap text-sm border-x ${
                isTabActive(tab.value)
                  ? "bg-white text-black"
                  : "bg-[#F5F9FF] text-muted-foreground"
              }`}
              onClick={() => {
                setActiveTab(tab.value);
                onTabChange?.(tab.value);
              }}
            >
              <div className="flex items-center gap-2">
                {tabIcon && <Icon icon={tabIcon} width={20} />}
                <span className="truncate">{tab.label}</span>
              </div>
              {allowClose && tab.value !== initialTabs[0]?.value && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.value);
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
        <Button
          variant="ghost"
          className="flex items-center gap-1 text-sm text-muted-foreground bg-white rounded-none ml-2"
          onClick={() =>
            availableTabs?.length &&
            showDrawer({
              title: "Add View",
              size: "xl",
              content: <DrawerContent availableTabs={availableTabs} />,
            })
          }
        >
          <Plus className="w-4 h-4" />
          Add View
        </Button>
      )}
    </div>
  );
}

function DrawerContent({ availableTabs }) {
  const { tabs, addTab, removeTab, getMaxTabs } = useViewTabsStore();
  const maxTabs = getMaxTabs();
  const isLimitReached = tabs.length >= maxTabs;

  return (
    <div className="py-4 space-y-6">
      {/* Current Views */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Current Views</h3>
        <div className="flex flex-col flex-wrap gap-2">
          {tabs.map((tab) => (
            <CheckboxInput
              key={tab.value}
              title={tab.label}
              checked={true}
              onChange={(e) => {
                if (!e.target.checked) {
                  removeTab(tab.value);
                }
              }}
            />
          ))}
          {tabs.length === 0 && (
            <span className="text-xs text-gray-400">No views selected</span>
          )}
        </div>
      </div>

      {/* Available Views */}
      <div className="space-y-4">
        {availableTabs.map((group) => (
          <div key={group.title}>
            <h4 className="text-sm font-medium mb-2">{group.title}</h4>
            <div className="space-y-2">
              {group.options.map((option) => {
                const isSelected = tabs.some((t) => t.value === option.value);
                return (
                  <CheckboxInput
                    key={option.value}
                    title={option.label}
                    checked={isSelected}
                    disabled={!isSelected && isLimitReached} // 👈 disable new add if limit reached
                    onChange={(e) => {
                      if (e.target.checked) {
                        addTab(option);
                      } else {
                        removeTab(option.value);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isLimitReached && (
        <p className="text-xs text-orange-500">
          Maximum {maxTabs} views allowed. Please remove one to add another.
        </p>
      )}
    </div>
  );
}
