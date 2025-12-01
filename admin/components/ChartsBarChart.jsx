"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import LoadingSkeletonCard from "@/components/LoadingSkeletonCard";

export default function ChartsBarChart({ data = [], loading = true }) {
  if (!data) return null;

  const { chart_info, data: chartData } = data;

  return (
    <>
      {loading ? (
        <LoadingSkeletonCard />
      ) : (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle>{chart_info?.title}</CardTitle>
            <div className="flex items-center space-x-4">
              {chart_info?.yKeys?.map((ykey, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: ykey?.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{ykey?.title}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  barGap={0}
                  barSize={18}
                  margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey={chart_info?.xKey?.title}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: chart_info?.xKey?.color || "#6B7280",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value / 1000}K`}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value.toLocaleString()}`, ""]}
                    contentStyle={{
                      borderRadius: "8px",
                      borderColor: "#E5E7EB",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ display: "none" }} />

                  {chart_info?.yKeys?.map((ykey, i) => (
                    <Bar
                      key={i}
                      dataKey={ykey?.title}
                      fill={ykey?.color}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
