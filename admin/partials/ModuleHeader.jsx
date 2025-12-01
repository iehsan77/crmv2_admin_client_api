"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/FormFields/DateRangePicker";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import useCommonStore from "@/stores/useCommonStore";

export default function ModuleHeader({ title = "Module", children }) {
  const contentRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [height, setHeight] = useState("auto");

  const { range, setRange } = useCommonStore();

  // Measure height whenever collapsed state changes
  useLayoutEffect(() => {
    if (!contentRef.current) return;

    if (isCollapsed) {
      setHeight(0);
    } else {
      const scrollHeight = contentRef.current.scrollHeight;
      setHeight(scrollHeight);
      // reset to auto after animation for responsiveness
      const timeout = setTimeout(() => setHeight("auto"), 300);
      return () => clearTimeout(timeout);
    }
  }, [isCollapsed]);

  return (
    <div>
      {/* Top Row */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>

        <div className="flex items-center gap-4">
          {/* Date Range Picker (optional) */}
          {setRange && (
            <DateRangePicker
              value={range}
              onChange={setRange}
              minDate={new Date(2023, 0, 1)}
              //maxDate={new Date()}
              allowClear={false}
            />
          )}

          {/* Collapse Button */}
          <Button
            variant="outline"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="border-0 shadow-none hover:bg-transparent flex items-center gap-2"
          >
            {isCollapsed ? "Expand" : "Collapse"}
            <div className="p-1 border rounded-full shadow-md">
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-300",
                  isCollapsed && "rotate-180"
                )}
              />
            </div>
          </Button>
        </div>
      </div>

      {/* Collapsible Section */}
      <div
        ref={contentRef}
        style={{
          maxHeight: height === "auto" ? "none" : `${height}px`,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <div className="grid grid-cols-1 gap-4 py-1">{children}</div>
      </div>
    </div>
  );
}
