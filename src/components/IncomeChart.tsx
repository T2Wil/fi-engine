"use client";

import { useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { DashboardResult } from "@/engine/computation";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSuggestionsForDistrict } from "@/data/nludmpSuggestions";
import { DISTRICT_COST_BANDS } from "@/data/districtCostBands";
import type { TranslationKey } from "@/i18n/translations";

interface IncomeChartProps {
  result: DashboardResult;
}

const COLORS = {
  strained: "#ef4444",
  stable: "#eab308",
  strong: "#22c55e",
};

const SECTOR_COLORS: Record<string, string> = {
  agriculture: "text-green-600 dark:text-green-400",
  urban: "text-blue-600 dark:text-blue-400",
  industry: "text-amber-600 dark:text-amber-400",
  tourism: "text-purple-600 dark:text-purple-400",
  climate: "text-emerald-600 dark:text-emerald-400",
  savings: "text-gray-600 dark:text-gray-400",
};

export function IncomeChart({ result }: IncomeChartProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isDark = theme === "dark";
  const { chartData, districtAffordability } = result;
  const data = chartData.map((row, i) => ({
    ...row,
    level: districtAffordability[i]?.level ?? "stable",
    fill:
      COLORS[districtAffordability[i]?.level ?? "stable"],
  }));

  const selectedDistrict =
    selectedIndex != null && data[selectedIndex]
      ? {
          name: data[selectedIndex].district,
          affordability: districtAffordability[selectedIndex],
          costTier: DISTRICT_COST_BANDS[selectedIndex]?.tier ?? "low",
        }
      : null;

  const suggestions =
    selectedDistrict && selectedDistrict.affordability
      ? getSuggestionsForDistrict(
          selectedDistrict.name,
          selectedDistrict.costTier,
          selectedDistrict.affordability.level,
          result.monthlySavingsRwf
        )
      : [];

  const gridStroke = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickFill = isDark ? "#8a8a8f" : "#6b7280";
  const tooltipBg = isDark ? "#1e1e22" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const labelColor = isDark ? "#e5e5e5" : "#171717";

  const chartHeight = 280;

  const handleChartClick = useCallback((nextState: { activeTooltipIndex?: number }) => {
    const index = nextState?.activeTooltipIndex;
    setSelectedIndex((prev) => (typeof index === "number" && prev === index ? null : index ?? null));
  }, []);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 backdrop-blur border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
      <p className="text-sm font-medium text-gray-500 dark:text-[#8a8a8f] mb-2">
        {t("chartTitle")}
      </p>
      <div style={{ width: "100%", height: chartHeight }} className="min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            onClick={handleChartClick}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="district"
              tick={{ fill: tickFill, fontSize: 10 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: tickFill, fontSize: 10 }}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
              domain={[0, "auto"]}
            />
          <Tooltip
            contentStyle={{
              background: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "12px",
            }}
            labelStyle={{ color: labelColor }}
            formatter={(value: number) => [
              value.toLocaleString("en-RW", { maximumFractionDigits: 0 }),
              "",
            ]}
            labelFormatter={(label) => t("districtLabel", { name: label })}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={() => t("comfortableCost")}
          />
          <Bar
            dataKey="comfortableCostRwf"
            name={t("comfortableCost")}
            radius={[4, 4, 0, 0]}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.fill}
                opacity={selectedIndex != null && selectedIndex !== index ? 0.5 : 1}
                stroke={selectedIndex === index ? (isDark ? "#fff" : "#111") : undefined}
                strokeWidth={selectedIndex === index ? 2 : 0}
              />
            ))}
          </Bar>
          <ReferenceLine
            y={result.input.incomeRwf}
            stroke="#1488fc"
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{
              value: t("yourIncome"),
              position: "right",
              fill: "#1488fc",
              fontSize: 11,
            }}
          />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2 justify-center text-xs text-gray-500 dark:text-[#6a6a6f]">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500" /> {t("strainedLegend")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-yellow-500" /> {t("stableLegend")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-green-500" /> {t("strongLegend")}
        </span>
      </div>

      {/* NLUDMP investment suggestion panel */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
          {t("nludmpSource")}
        </p>
        {selectedIndex == null ? (
          <p className="text-xs text-gray-500 dark:text-[#8a8a8f] italic">
            {t("chartClickHint")}
          </p>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="text-xs">
                <span className={`font-medium ${SECTOR_COLORS[s.sector] ?? ""}`}>
                  {t(s.titleKey as TranslationKey)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {" "}
                  {t(s.bodyKey as TranslationKey, s.params)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
