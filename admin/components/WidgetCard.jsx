"use client";
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculatePercentageChange } from "@/lib/calculatePercentageChange";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import { Icon } from "@iconify/react";
import Image from "next/image";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white text-xs rounded-md px-2 py-1 shadow-md">
        <p>{payload[0].value?.toLocaleString() || 0}</p>
      </div>
    );
  }
  return null;
};

const WidgetCard = ({ data }) => {
  // Calculate change from lineChartData if available, otherwise use backend-provided change
  const calculatedChange = useMemo(() => {
    if (data?.lineChartData && data.lineChartData.length >= 2) {
      return calculatePercentageChange(data.lineChartData);
    }
    // Parse backend change string (e.g., "+9%", "-4.6%")
    if (data?.change) {
      const changeStr = String(data.change).trim();
      const match = changeStr.match(/([+-]?)(\d+\.?\d*)%/);
      if (match) {
        const isPositive = match[1] === "+" || (match[1] === "" && parseFloat(match[2]) > 0);
        const isNegative = match[1] === "-" || (match[1] === "" && parseFloat(match[2]) < 0);
        return {
          change: changeStr,
          isPositive: isPositive ? true : isNegative ? false : null,
        };
      }
    }
    return { change: "0%", isPositive: null };
  }, [data?.lineChartData, data?.change]);

  // Format total value with proper number formatting
  const formattedTotal = useMemo(() => {
    if (!data?.total) return "0";
    const totalStr = String(data.total);
    // If it's a number, format it with commas
    if (!isNaN(parseFloat(totalStr))) {
      return parseFloat(totalStr).toLocaleString();
    }
    return totalStr;
  }, [data?.total]);

  // Determine if change is positive/negative for styling
  const isPositive = calculatedChange?.isPositive === true;
  const isNegative = calculatedChange?.isPositive === false;
  const changeColor = isPositive ? "text-[#11A152]" : isNegative ? "text-[#FF928E]" : "text-gray-500";
  const borderColor = isPositive ? "border-[#11A152]" : isNegative ? "border-[#FF928E]" : "border-gray-300";

  return (
    <Card className="py-4 px-4 flex flex-col gap-0 group hover:shadow-md transition-shadow duration-300 bg-white border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between px-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          {data?.icon ? (
            <Image
              src={data.icon}
              width={28}
              height={28}
              alt={data.title || "statistic"}
              className="h-7 w-auto object-contain"
            />
          ) : data?.iconClass ? (
            <Icon
              icon={`ph:${data.iconClass}`}
              width={28}
              height={28}
              className="text-primary"
            />
          ) : (
            <Icon
              icon="ph:chart-line"
              width={28}
              height={28}
              className="text-primary"
            />
          )}
          <span className="text-sm font-semibold text-gray-700 leading-tight">
            {data?.title || "Statistic"}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-0 grow flex flex-col">
        {/* Main content area */}
        <div className={cn("mt-6 transition-all duration-300", "group-hover:-translate-y-2")}>
          <div className="grid grid-cols-4 gap-2 h-full">
            {/* Left side - Value and change */}
            <div className="col-span-3 h-full flex flex-col justify-end">
              <div className="text-3xl font-bold text-[#1E3A8A] mb-2 transition-all duration-300 group-hover:text-2xl">
                {formattedTotal}
              </div>
              <div className={cn("text-sm transition-all duration-300 mt-1 flex items-center gap-1.5", changeColor)}>
                <div className={cn("flex items-center gap-1 w-fit py-0.5 px-1.5 border-b-2", borderColor)}>
                  {isPositive && <ArrowUp className="h-3 w-3" />}
                  {isNegative && <ArrowDown className="h-3 w-3" />}
                  <span className="font-medium">{calculatedChange?.change || data?.change || "0%"}</span>
                </div>
                <span className="text-xs text-muted-foreground">from last week</span>
              </div>
            </div>

            {/* Right side - Mini chart */}
            <div className="col-span-1 h-full flex items-end">
              <ResponsiveContainer width="100%" height="60px">
                <AreaChart
                  data={data?.lineChartData || []}
                  margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                >
                  <defs>
                    <linearGradient
                      id={`statGradient-${isPositive ? "positive" : "negative"}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={isPositive ? "#11A152" : "#FF928E"}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={isPositive ? "#11A152" : "#FF928E"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isPositive ? "#11A152" : isNegative ? "#FF928E" : "#94a3b8"}
                    fill={`url(#statGradient-${isPositive ? "positive" : "negative"})`}
                    strokeWidth={2}
                    fillOpacity={1}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Description on hover */}
        {data?.description && (
          <div className="relative mt-4 min-h-[40px]">
            <div
              className={cn(
                "absolute left-0 right-0 transition-all duration-300",
                "opacity-0 translate-y-2 pointer-events-none",
                "group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
              )}
            >
              <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-md p-2 border border-gray-200">
                {data.description}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(WidgetCard);
