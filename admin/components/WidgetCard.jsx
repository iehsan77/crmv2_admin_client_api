"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowDown, ArrowUp, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculatePercentageChange } from "@/lib/calculatePercentageChange";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import { Icon } from "@iconify/react";
import Image from "next/image";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white text-xs rounded-md px-2 py-1 shadow-md">
        <p>{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const WidgetCard = ({ data }) => {
  const change = calculatePercentageChange(data?.lineChartData);

  return (
    <Card className="py-4 px-4 flex flex-col gap-0 group">
      <CardHeader className="flex flex-row items-center justify-between px-0">
        <CardTitle className=" flex items-center gap-2">
          {data?.icon ? (
            <Image
              src={data?.icon}
              width={30}
              height={30}
              alt="cars"
              className="h-6 w-auto"
            />
          ) : data?.iconClass ? (
            <Icon
              icon={`ph:${data?.iconClass}`}
              width={24}
              height={24}
              className="text-primary"
            />
          ) : (
            <Icon
              icon="ph:car"
              width={24}
              height={24}
              className="text-primary"
            />
          )}

          <span className="text-[14px] font-bold text-[#666666]">
            {data?.title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 grow flex flex-col">
        {/* Upper content */}
        <div
          className={cn(
            "mt-8 transition-all duration-300",
            "group-hover:-translate-y-4"
          )}
        >
          <div className="grid grid-cols-4 gap-1 h-full">
            <div className="col-span-3 h-full flex flex-col justify-end">
              <div className="text-3xl font-bold text-[#1E3A8A] mb-2 transition-all duration-300 group-hover:text-xl group-hover:mb-0">
                {data?.total}
              </div>
              <div
                className={cn(
                  "text-sm group-hover:text-xs 53 transition-all duration-300 mt-1 flex gap-1",
                  change?.isPositive ? "text-[#11A152]" : "text-[#FF928E]"
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-1 59 w-fit py-0.5 px-1 border-b",
                    change?.isPositive === true
                      ? "border-[#11A152]" // true
                      : change?.isPositive === false
                      ? "border-[#FF928E]" // false
                      : change?.isPositive === null
                      ? "border-[#fff]" // null
                      : "border-gray-300" // fallback
                  )}
                >
                  {/*change?.isPositive === true && (
                    <>
                      <ArrowUp className="h-3 w-3 text-[#11A152]" />
                      {change?.change}
                    </>
                  )}
                  {change?.isPositive === false && (
                    <>
                      <ArrowDown className="h-3 w-3 text-[#FF928E]" />
                      {change?.change}
                    </>
                  )}
                  {change?.isPositive === null && (
                    <span className="text-muted-foreground">0</span>
                  ) */}
                  {data?.change}
                </div>
                <div className="text-muted-foreground">from last week</div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height="50%" className="mt-auto">
              <AreaChart data={data?.lineChartData}>
                <defs>
                  <linearGradient
                    id="statColorSearch"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FF928E" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FF928E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="statColorDirect"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#11A152" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#11A152" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={change?.isPositive ? "#11A152" : "#FF928E"}
                  fill={`url(#${
                    change?.isPositive ? "statColorDirect" : "statColorSearch"
                  })`}
                  strokeWidth={2}
                  fillOpacity={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="relative">
          <div
            className={cn(
              "absolute left-0 right-0 transition-all duration-500",
              "opacity-0 translate-y-4 pointer-events-none",
              "group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
            )}
          >
            <div className="text-foreground text-xs">{data?.description}</div>
          </div>

          {/* Spacer div taake height reserve rahe */}
          {/* <div className="h-12" /> */}
        </div>
      </CardContent>
    </Card>
  );
};
export default WidgetCard;
