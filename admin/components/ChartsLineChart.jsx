"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const data = [
  { month: "Jan", km: 60 },
  { month: "Feb", km: 70 },
  { month: "Mar", km: 65 },
  { month: "Apr", km: 40 },
  { month: "May", km: 65 },
  { month: "Jun", km: 80 },
  { month: "Jul", km: 90 },
  { month: "Aug", km: 89 },
];

export default function ChartsLineChart({ data = [] }) {
  const { chart_info, data: chartData } = data;

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>{chart_info?.title}</CardTitle>
        <span className="text-sm text-muted-foreground">
          {chart_info?.title_right}
        </span>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart_info?.xKey?.title} />
            <YAxis unit={chart_info?.yKeys?.[0]?.key} />
            <Tooltip />

            {chart_info?.yKeys?.map((ykey, i) => (
              <Line
                type={ykey?.title}
                dataKey={ykey?.key}
                stroke={ykey?.color}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
      {chart_info?.description && (
        <div className="text-sm block text-muted-foreground px-6">
          {chart_info?.description}
        </div>
      )}
    </Card>
  );
}
