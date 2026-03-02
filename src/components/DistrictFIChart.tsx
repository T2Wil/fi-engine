"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DashboardResult } from "@/engine/computation";
import { getDistrictYearsToFI } from "@/engine/fiProjection";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";

interface DistrictFIChartProps {
  readonly result: DashboardResult | null;
}

export function DistrictFIChart({ result }: DistrictFIChartProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  const gridStroke = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickFill = isDark ? "#8a8a8f" : "#6b7280";
  const tooltipBg = isDark ? "#1e1e22" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  if (!result) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 border border-gray-200 dark:border-white/10 p-6 flex items-center justify-center min-h-[400px] text-gray-500 dark:text-[#6a6a6f] text-sm">
        {t("districtFIChartEmpty")}
      </div>
    );
  }

  const rows = getDistrictYearsToFI(result);
  const hasFeasible = rows.some((r) => r.yearsToFI != null);
  if (!hasFeasible) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 border border-gray-200 dark:border-white/10 p-6 flex items-center justify-center min-h-[400px] text-gray-500 dark:text-[#6a6a6f] text-sm">
        {t("districtFIChartNoFeasible")}
      </div>
    );
  }

  const feasibleYears = rows.filter((r) => r.yearsToFI != null).map((r) => r.yearsToFI as number);
  const maxFeasible = feasibleYears.length > 0 ? Math.max(...feasibleYears) : 20;
  const maxYears = Math.min(50, Math.max(20, maxFeasible * 1.15));

  const data = rows.map((r) => ({
    district: r.district,
    years: r.yearsToFI != null ? r.yearsToFI : maxYears + 5,
    yearsLabel: r.yearsToFI != null ? r.yearsToFI : "—",
    isHighlight: r.isHighlight,
    isReachable: r.yearsToFI != null,
  }));

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 backdrop-blur border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
      <p className="text-sm font-medium text-gray-500 dark:text-[#8a8a8f] mb-1">
        {t("districtFIChartTitle")}
      </p>
      <p className="text-xs text-gray-400 dark:text-[#6a6a6f] mb-3">
        {t("districtFIChartHighlight")}
      </p>
      <div className="w-full min-h-[400px]" style={{ height: Math.max(400, data.length * 22) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, maxYears]}
              tick={{ fill: tickFill, fontSize: 10 }}
              tickLine={false}
              tickFormatter={(v) => (v >= 999 ? "—" : `${v}`)}
            />
            <YAxis
              type="category"
              dataKey="district"
              width={90}
              tick={{ fill: tickFill, fontSize: 9 }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: "8px",
              }}
              formatter={(_value: number, _name: string, item: { payload?: { district: string; yearsLabel: string | number } }) => {
                const p = item?.payload;
                if (!p) return ["", ""];
                return [
                  p.yearsLabel === "—" ? "—" : `${p.yearsLabel} years`,
                  p.district,
                ];
              }}
              labelFormatter={() => ""}
            />
            <Bar dataKey="years" radius={[0, 4, 4, 0]} maxBarSize={14}>
              {data.map((entry) => (
                <Cell
                  key={entry.district}
                  fill={entry.isHighlight ? "#10b981" : isDark ? "#3f3f46" : "#d4d4d8"}
                  opacity={entry.isReachable ? 1 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
