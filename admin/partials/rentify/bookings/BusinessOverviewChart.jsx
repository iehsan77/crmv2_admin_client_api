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

const data = [
  { month: "Jan", Expense: 22000, Income: 38000 },
  { month: "Feb", Expense: 28000, Income: 42000 },
  { month: "Mar", Expense: 16000, Income: 28000 },
  { month: "Apr", Expense: 26000, Income: 37000 },
  { month: "May", Expense: 22000, Income: 50000 },
  { month: "Jun", Expense: 31000, Income: 41000 },
  { month: "Jul", Expense: 25000, Income: 34000 },
  { month: "Aug", Expense: 14000, Income: 36000 },
  { month: "Sep", Expense: 19000, Income: 27000 },
  { month: "Oct", Expense: 22000, Income: 41000 },
  { month: "Nov", Expense: 16000, Income: 38000 },
  { month: "Dec", Expense: 23000, Income: 30000 },
];

export default function VehiclesBusinessOverviewChart() {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle>Business Overview</CardTitle>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#1E3A8A]"></div>
            <span className="text-sm text-gray-600">Expense</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#60A5FA]"></div>
            <span className="text-sm text-gray-600">Income</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barGap={0}
              barSize={18}
              margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            >
              <CartesianGrid vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `AED ${value / 1000}K`}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                
              />
              <Tooltip
                formatter={(value) => [`AED ${value.toLocaleString()}`, ""]}
                contentStyle={{
                  borderRadius: "8px",
                  borderColor: "#E5E7EB",
                  fontSize: "12px",
                }}
              />
              {/* Hide the default legend since we're using a custom one */}
              <Legend wrapperStyle={{ display: "none" }} />
              <Bar dataKey="Expense" fill="#1E3A8A" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Income" fill="#60A5FA" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
