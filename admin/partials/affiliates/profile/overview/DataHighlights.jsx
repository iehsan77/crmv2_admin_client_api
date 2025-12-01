"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDateTime } from "@/helper/GeneralFunctions";
import { Icon } from "@iconify/react";

export default function DataHighlights({ highlights }) {

  console.log("highlights 10")
  console.log(highlights)

  const stats = [
    {
      label: "Total Earnings",
      value: "AED "+highlights?.total_earning,
      icon: "lucide:banknote",
      img:"/icons/dollars.svg",
      link: "#",
    },
    {
      label: "Affiliated Vehicles",
      value: highlights?.affiliated_vehicles,
      icon: "lucide:shield-check",
      img:"/icons/affiliates_vehicle.svg",
      link: "#",
    },
    {
      label: "Affiliated Since",
      value: formatDateTime(highlights?.affiliated_date)+" EST",
      icon: "lucide:calendar",
      img:"/icons/dots_calendar.svg",
      link: "#",
    },
  ];

  return (
    <Card className="rounded-lg shadow-md border">
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-base">Data Highlights</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {stats?.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              {/* Icon */}
              <Image src={item.img} alt="icon" width={30} height={30} className="mb-3" />

              {/* Label */}
              <p className="text-sm font-semibold">{item.label}</p>

              {/* Value */}
              <p className="text-primary font-medium text-xs">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
