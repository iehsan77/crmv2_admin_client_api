"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import LoadingSkeletonCard from "@/components/LoadingSkeletonCard";

export default function ChartsPieChart({
  title = "Booking Status",
  centerLabel = "Booking Status",
  data = [],
  loading = true,
}) {
  // Check if all values are 0
  const allZero =
    data?.chartData?.length > 0 &&
    data.chartData.every((item) => Number(item.value) === 0);

  return (
    <>
      {loading ? (
        <LoadingSkeletonCard />
      ) : (
        <Card className="rounded-xl shadow-sm h-full py-4">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-between gap-4 xl:flex-row">
            {/* Chart */}
            <div className="w-2/3 h-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      allZero
                        ? [{ value: 1, color: "#e5e7eb" }] // light gray color (Tailwind gray-200)
                        : data?.chartData
                    }
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {allZero ? (
                      <Cell fill="#e5e7eb" />
                    ) : (
                      data?.chartData?.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item?.color} />
                      ))
                    )}
                  </Pie>

                  {/* Center text */}
                  <foreignObject
                    x="25%"
                    y="35%"
                    width="50%"
                    height="50%"
                    className="flex items-center justify-center"
                  >
                    <div className="w-full text-center text-lg font-medium text-gray-700">
                      {centerLabel?.split(" ")?.map((word, i) => (
                        <div key={i}>{word}</div>
                      ))}
                    </div>
                  </foreignObject>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="w-full xl:w-fit flex flex-col gap-3 text-sm">
              {data?.chartData?.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: allZero ? "#e5e7eb" : item.color,
                    }}
                  />
                  <span>{item?.title}</span>
                  <span className="ml-auto text-gray-500">
                    {item.percent}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>

          {/* Bottom Stats */}
          <div className="px-6 text-sm mt-auto">
            {data?.counters?.map((counter, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{counter?.title}</span>
                <span className="font-medium">{counter?.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
