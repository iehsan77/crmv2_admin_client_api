"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Icon } from "@iconify/react";

import useCustomersStore from "@/stores/customers/useCustomersStore";
import { formatDateTime } from "@/helper/GeneralFunctions";

export default function DataHighlights() {

  const { customer } = useCustomersStore();

  const stats = [
    {
      label: "Create Date",
      value: formatDateTime(customer?.createdon),
      icon: "uil:calendar-alt",
      link: "#",
    },
    {
      label: "Total Bookings",
      value: customer?.bookings?.length,
      icon: "maki:car-rental",
      link: "#",
    },
    {
      label: "Last Activity Date",
      value: formatDateTime(customer?.last_activity_date),
      icon: "uil:calendar-alt",
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
          {stats.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              {/* Icon */}
              <Icon icon={item.icon} className="w-8 h-8 text-green-600 mb-2" />

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
