"use client";
import { useEffect } from "react";
import { X, Plus } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import CheckboxInput from "@/components/FormFields/CheckboxInput";

export default function ViewsTabs({ onTabChange, useStore, viewsStore }) {
  const { showDrawer } = useDrawer();
  const {
    tabs,
    activeTab,
    setTabs,
    setActiveTab,
    setDefaultTab,
    removeTab,

    // config values from store
    defaultTab,
    availableTabs,
    allowClose,
    showAddView,
  } = viewsStore();
  
  const setPage = useStore((s) => s.setPage);

  // ✅ initialize only once on mount
  useEffect(() => {
    setDefaultTab(defaultTab);
    if (tabs.length === 0 && availableTabs.length > 0) {
      setTabs(availableTabs[0].options); // or use initialTabs in store
      setActiveTab(defaultTab || availableTabs[0].options[0]?.value);
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
                onTabChange?.(1);
                setPage(1);
              }}
            >
              <span className="truncate">{tab.label}</span>
              {!isTabActive?.(tab.value) &&
                allowClose &&
                tab.value !== defaultTab && (
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
            showDrawer({
              title: "Add View",
              size: "xl",
              content: <DrawerContent viewsStore={viewsStore} />,
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

function DrawerContent({ viewsStore }) {
  const {
    tabs,
    addTab,
    removeTab,
    maxTabs,
    availableTabs,
    activeTab,
    defaultTab,
  } = viewsStore();
  const isLimitReached = tabs.length >= maxTabs;
  const isTabActive = (value) => activeTab === value;
  return (
    <div className="py-4 space-y-6">
      {/* Current Views */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Current Views</h3>
        <div className="flex flex-col flex-wrap gap-2">
          {tabs.map((tab) => {
            let title = tab.label;

            if (tab.value === defaultTab && tab.value === activeTab) {
              title += " (default, active)";
            } else if (tab.value === defaultTab) {
              title += " (default)";
            } else if (tab.value === activeTab) {
              title += " (active)";
            }
            const isSelected = tabs.some((t) => t.value === tab.value);
            return (
              <CheckboxInput
                key={tab.value}
                title={title}
                checked={true}
                onChange={(e) => {
                  if (!e.target.checked) {
                    removeTab(tab.value);
                  }
                }}
                disabled={
                  (!isSelected && isLimitReached) ||
                  isTabActive?.(tab.value) ||
                  defaultTab == tab.value
                }
              />
            );
          })}

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
                    // title={
                    //   activeTab===option.value
                    //     ? `${option.label} (active)` // ✅ also works here if shown in available list
                    //     : option.label
                    // }
                    title={
                      option.value === defaultTab
                        ? `${option.label} (default${
                            activeTab === option.value ? ", active" : ""
                          })`
                        : activeTab === option.value
                        ? `${option.label} (active)`
                        : option.label
                    }
                    checked={isSelected}
                    disabled={
                      (!isSelected && isLimitReached) ||
                      isTabActive?.(option.value) ||
                      defaultTab == option.value
                    }
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
        <p className="text-sm text-red-500">
          Maximum {maxTabs} views allowed. Please remove one to add another.
        </p>
      )}
    </div>
  );
}
