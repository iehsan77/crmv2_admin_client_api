"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Card } from "@/components/ui/card";

export default function VehiclesMetricsCardList({ data }) {
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
            <p className="text-2xl font-bold text-primary text-center mt-1">
              {item.value}
            </p>

            {/* Change Indicator */}
            <div
              className={cn(
                "flex items-center justify-center gap-1 text-xs font-medium mt-2",
                item.change >= 0 ? "text-green-600" : "text-red-500"
              )}
            >
              <Icon
                icon={item.change >= 0 ? "mdi:arrow-up" : "mdi:arrow-down"}
                className="w-3 h-3"
              />
              <span className="border-b">
                {item.change > 0 ? `+${item.change}%` : `${item.change}%`}
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

// "use client";

// import { cn } from "@/lib/utils";
// import { Card } from "@/components/ui/card";
// import { Icon } from "@iconify/react";

// // Reusable Single Card
// function MetricsCard({ title, value, change, positive }) {
//   return (
//     <Card className="p-4 flex flex-col items-start min-w-[200px]">
//       {/* Title */}
//       <p className="text-sm text-muted-foreground">{title}</p>

//       {/* Value */}
//       <h3 className="text-2xl font-bold mt-1">{value}</h3>

//       {/* Change */}
//       <div className="flex items-center text-xs mt-1">
//         <Icon
//           icon={positive ? "mdi:arrow-up" : "mdi:arrow-down"}
//           className={cn(
//             "w-4 h-4",
//             positive ? "text-green-500" : "text-red-500"
//           )}
//         />
//         <span
//           className={cn(
//             "font-medium ml-1",
//             positive ? "text-green-600" : "text-red-600"
//           )}
//         >
//           {change}
//         </span>
//         <span className="text-muted-foreground ml-1">From Previous Period</span>
//       </div>
//     </Card>
//   );
// }

// // Parent Component - List
// export default function MetricsCardList({ data }) {
//   return (
//     <div className="flex overflow-x-auto gap-4 scrollbar-hide">
//       {data.map((item, i) => (
//         <MetricsCard key={i} {...item} />
//       ))}
//     </div>
//   );
// }
