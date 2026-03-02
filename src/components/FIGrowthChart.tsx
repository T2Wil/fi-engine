"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { DashboardResult } from "@/engine/computation";
import { computeFIProjection, buildFIGrowthSeries } from "@/engine/fiProjection";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";

interface FIGrowthChartProps {
  readonly result: DashboardResult | null;
}

function formatRwfShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

export function FIGrowthChart({ result }: FIGrowthChartProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  const gridStroke = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickFill = isDark ? "#8a8a8f" : "#6b7280";
  const tooltipBg = isDark ? "#1e1e22" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const labelColor = isDark ? "#e5e5e5" : "#171717";

  if (!result) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 border border-gray-200 dark:border-white/10 p-6 flex items-center justify-center min-h-[300px] text-gray-500 dark:text-[#6a6a6f] text-sm">
        {t("fiGrowthChartEmpty")}
      </div>
    );
  }

  const projection = computeFIProjection(result);
  const hasMeaningfulGrowth = result.input.netWorthRwf > 0 || projection.monthlySavingsRwf > 0;
  if (!hasMeaningfulGrowth) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 border border-gray-200 dark:border-white/10 p-6 flex items-center justify-center min-h-[300px] text-gray-500 dark:text-[#6a6a6f] text-sm">
        {t("fiGrowthChartEmpty")}
      </div>
    );
  }

  const series = buildFIGrowthSeries(projection, result.input.netWorthRwf);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 backdrop-blur border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
      <p className="text-sm font-medium text-gray-500 dark:text-[#8a8a8f] mb-2">
        {t("fiGrowthChartTitle")}
      </p>
      <div style={{ width: "100%", height: 300 }} className="min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={series}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          >
            <defs>
              <linearGradient id="fiGrowthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="year"
              tick={{ fill: tickFill, fontSize: 10 }}
              tickLine={false}
              tickFormatter={(v) => (v === 0 ? t("fiGrowthChartNow") : `${v}`)}
            />
            <YAxis
              tick={{ fill: tickFill, fontSize: 10 }}
              tickLine={false}
              tickFormatter={(v) => formatRwfShort(v)}
              domain={[0, (dataMax: number) => Math.max(dataMax, projection.fiTargetRwf) * 1.05]}
            />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: "12px",
              }}
              labelStyle={{ color: labelColor }}
              formatter={(value: number) => [
                value.toLocaleString("en-RW", { maximumFractionDigits: 0 }) + " RWF",
                t("fiGrowthChartNetWorth"),
              ]}
              labelFormatter={(year) =>
                year === 0 ? t("fiGrowthChartNow") : `${t("fiGrowthChartYear")} ${year}`
              }
            />
            <ReferenceLine
              y={projection.fiTargetRwf}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: t("fiGrowthChartFITarget"),
                position: "right",
                fill: "#f59e0b",
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="netWorthRwf"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#fiGrowthFill)"
              name={t("fiGrowthChartNetWorth")}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2 justify-center text-xs text-gray-500 dark:text-[#6a6a6f]">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" /> {t("fiGrowthChartNetWorth")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full border border-amber-500 border-dashed" /> {t("fiGrowthChartFITarget")}
        </span>
      </div>
    </div>
  );
}
