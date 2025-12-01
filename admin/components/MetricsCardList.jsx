"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Card } from "./ui/card";

export default function MetricsCardList({ data }) {

  return (
    <Card className="w-full overflow-x-auto">
      <div className="flex rounded-md divide-x divide-gray-200">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex-1 min-w-[180px] px-2 py-4 flex flex-col justify-between"
          >
            {/* Title */}
            <h3 className="text-sm font-bold text-gray-600 text-center">
              {item.title}
            </h3>

            {/* Value */}
            <p className="text-2xl font-bold text-[#1E3A8A] text-center mt-1">
              {item.value}
            </p>

            {/* Change Indicator */}
            <div
              className={cn(
                "flex items-center justify-center gap-1 text-xs font-medium mt-2",
                item.change > 0
                  ? "text-green-600"
                  : item.change < 0
                  ? "text-red-500"
                  : "text-gray-500" // neutral for 0
              )}
            >
              <Icon
                icon={
                  item.change > 0
                    ? "mdi:arrow-up"
                    : item.change < 0
                    ? "mdi:arrow-down"
                    : ""
                }
                className="w-3 h-3"
              />
              <span className="border-b">
                {item.change > 0 ? `${item.change}` : `${item.change}`}
              </span>
              <span className="text-gray-500 font-normal text-[10px]">
                From Previous Period
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
