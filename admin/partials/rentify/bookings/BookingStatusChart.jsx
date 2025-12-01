"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function VehiclesBookingStatusChart({
  title = "Booking Status",
  data = [],
  colors = [],
  centerLabel = "",
  stats = [],
}) {
  return (
    <Card className="rounded-xl shadow-sm h-full py-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between">
        {/* Chart */}
        <div className="w-2/3 h-[160px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                // cx="50%"
                // cy="50%"
                innerRadius={50}
                outerRadius={80} // Keeping original thickness
                paddingAngle={0}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>

              {/* Center text with wrapping */}
              <foreignObject
                x="25%"
                y="35%"
                width="50%"
                height="50%"
                className="flex items-center justify-center"
              >
                <div className="w-full text-center text-lg font-medium text-gray-700">
                  {centerLabel.split(" ").map((word, i) => (
                    <div key={i}>{word}</div>
                  ))}
                </div>
              </foreignObject>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 text-sm">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index] }}
              />
              <span>{entry.name}</span>
              <span className="ml-auto text-gray-500">{entry.percent}%</span>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Bottom Stats */}
      <div className="px-6 text-sm mt-auto">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex justify-between">
            <span>{stat.label}</span>
            <span className="font-medium">{stat.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
