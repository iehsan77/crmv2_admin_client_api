"use client";
import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import LoadingSkeletonCard from "@/components/LoadingSkeletonCard";

const DummyData = [
  { month: "January", desktop: 5, mobile: 80, phone: 100 },
  { month: "February", desktop: 20, mobile: 200, phone: 45 },
  { month: "March", desktop: 237, mobile: 120, phone: 9 },
  { month: "April", desktop: 73, mobile: 190, phone: 78 },
  { month: "May", desktop: 209, mobile: 130, phone: 11 },
  { month: "June", desktop: 214, mobile: 140, phone: 2 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
};

export default function ChartsAreaChart({ data = [], loading = true }) {
  return (
    <>
      {loading ? (
        <LoadingSkeletonCard />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Area Chart - Gradient</CardTitle>
            <CardDescription>
              Showing total visitors for the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ✅ Must wrap inside ChartContainer */}
            <ChartContainer config={chartConfig} className="h-[300px] w-[100%]">
              <AreaChart
                data={DummyData}
                margin={{ left: 12, right: 12, bottom: 8, top: 8 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />

                {/* ✅ X-Axis */}
                <XAxis
                  dataKey="month"
                  tickLine
                  axisLine
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />

                {/* ✅ Y-Axis */}
                <YAxis
                  tickLine
                  axisLine
                  tickMargin={8}
                  domain={[0, 400]} // or [0, "auto"]
                 // ticks={[0, 100, 200, 300, 400]}
                  tickFormatter={(value) => `${value}`}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />

                {/* ✅ Tooltip */}
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

                {/* ✅ Gradients */}
                <defs>
                  <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>

                {/* ✅ Data Layers */}
                <Area
                  dataKey="mobile"
                  type="natural"
                  fill="url(#fillMobile)"
                  fillOpacity={0.4}
                  stroke="var(--chart-2)"
                  stackId="a"
                />
                <Area
                  dataKey="desktop"
                  type="natural"
                  fill="url(#fillDesktop)"
                  fillOpacity={0.4}
                  stroke="var(--chart-1)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}
