"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import LoadingSkeletonCard from "@/components/LoadingSkeletonCard";

/**
 * ✅ Global, configurable Area Chart component
 * @param {Object} data - Object with { chartData, chartConfig }
 * @param {Boolean} loading - Whether chart is loading
 */
export default function GlobalAreaChart({ data = {}, loading = false }) {
  // 🧱 Extract data + config
  const { chartData = [], chartConfig = {} } = data;

  const {
    title = "Area Chart",
    description = "Showing data trends over time",
    titleRight = "",
    series = [],
    options = {},
  } = chartConfig;

  const {
    height = 300,
    yDomain = [0, "auto"],
    showGrid = true,
    xKey = "month",
  } = options;

  // 🎨 Auto-generate gradients for each series
  const gradients = series.map((s, i) => {
    const gradientId = `fillGradient-${s.key || i}`;
    const color = s.color || `var(--chart-${i + 1})`;

    return (
      <linearGradient
        key={gradientId}
        id={gradientId}
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop offset="5%" stopColor={color} stopOpacity={0.8} />
        <stop offset="95%" stopColor={color} stopOpacity={0.1} />
      </linearGradient>
    );
  });

  return (
    <>
      {loading ? (
        <LoadingSkeletonCard />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between w-full">
              <span>{title}</span>
              <span
                className="flex items-center gap-3 text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: titleRight }}
              />
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>

          <CardContent>
            <ChartContainer
              config={chartConfig}
              className={`h-[${height}px] w-full`}
            >
              <AreaChart
                data={chartData}
                margin={{ left: 12, right: 12, bottom: 8, top: 8 }}
              >
                {showGrid && (
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                )}

                <XAxis
                  dataKey={xKey}
                  tickLine
                  axisLine
                  tickMargin={8}
                  tickFormatter={(v) => String(v).slice(0, 3)}
                />
                <YAxis
                  domain={yDomain}
                  tickLine
                  axisLine
                  tickMargin={8}
                  tickFormatter={(v) => `${v}`}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <defs>{gradients}</defs>

                {/* ✅ Dynamic area series */}
                {series.map((s, i) => {
                  const color = s.color || `var(--chart-${i + 1})`;
                  const gradientId = `fillGradient-${s.key || i}`;
                  return (
                    <Area
                      key={s.key}
                      dataKey={s.key}
                      type={s.type || "natural"}
                      fill={`url(#${gradientId})`}
                      fillOpacity={0.4}
                      stroke={color}
                      stackId={s.stackId || "a"}
                    />
                  );
                })}
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}
