"use client";

import {
  Tabs as ShadcnTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

export default function Tabs({ tabs, defaultValue }) {
  return (
    <ShadcnTabs
      defaultValue={defaultValue || tabs[0]?.value}
    //   className="w-full"
    >
      {/* Tab Navigation */}
      <TabsList
        className={`grid grid-cols-${tabs?.length} bg-background rounded-none p-0`}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex flex-col items-center justify-center gap-1 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
          >
            {tab.icon && (
              <span className="w-5 h-5 flex items-center justify-center">
                {tab.icon}
              </span>
            )}
            <span className="text-xs font-medium">{tab.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Tab Content */}
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="transition-all duration-300">
          {tab.content}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
}
