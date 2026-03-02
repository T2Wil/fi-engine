"use client";

import { useRef, useEffect } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import type { DashboardResult } from "@/engine/computation";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

interface InsightChatPanelProps {
  result: DashboardResult | null;
}

function formatRwf(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M RWF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k RWF`;
  return `${n} RWF`;
}

function generateInsights(
  result: DashboardResult,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): { role: "user" | "assistant"; content: string }[] {
  const {
    input,
    monthlySavingsRwf,
    savingsRate,
    lifestyleTier,
    districtAffordability,
  } = result;

  const savings = formatRwf(monthlySavingsRwf);
  const rate = (savingsRate * 100).toFixed(0);
  const tierLabel = t(
    lifestyleTier.tier === "lean"
      ? "tierLean"
      : lifestyleTier.tier === "middle"
        ? "tierMiddle"
        : lifestyleTier.tier === "upper"
          ? "tierUpper"
          : "tierHigher"
  );
  const tierDesc = t(
    lifestyleTier.tier === "lean"
      ? "tierDescLean"
      : lifestyleTier.tier === "middle"
        ? "tierDescMiddle"
        : lifestyleTier.tier === "upper"
          ? "tierDescUpper"
          : "tierDescHigher"
  );

  const lines: string[] = [];

  lines.push(t("insightLifestyle", { tier: tierLabel, description: tierDesc }));
  const savingsKey =
    savingsRate >= 0.2 ? "insightSavingsStrong" : savingsRate >= 0.1 ? "insightSavingsMedium" : "insightSavingsLow";
  lines.push(t(savingsKey, { savings, rate }));

  const strong = districtAffordability.filter((a) => a.level === "strong");
  const stable = districtAffordability.filter((a) => a.level === "stable");
  const strained = districtAffordability.filter((a) => a.level === "strained");

  if (strong.length > 0) {
    const names = strong.map((a) => a.district.name).join(", ");
    lines.push(t("insightStrongDistricts", { names, count: String(strong.length) }));
  }
  if (stable.length > 0) {
    lines.push(t("insightStableDistricts", { count: String(stable.length) }));
  }
  if (strained.length > 0) {
    lines.push(t("insightStrainedDistricts", { count: String(strained.length) }));
  }

  lines.push(t("insightNetWorth", { amount: formatRwf(input.netWorthRwf) }));

  return [
    { role: "user" as const, content: `Net worth: ${formatRwf(input.netWorthRwf)}, Income: ${formatRwf(input.incomeRwf)}, Expenses: ${formatRwf(input.expensesRwf)}` },
    { role: "assistant" as const, content: lines.join("\n\n") },
  ];
}

export function InsightChatPanel({ result }: InsightChatPanelProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = result ? generateInsights(result, t) : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/95 backdrop-blur border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col h-[280px] sm:h-[320px] shadow-sm dark:shadow-none">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-white/10">
        <Sparkles className="size-4 text-[#1488fc]" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">{t("yourFIInsight")}</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-[#6a6a6f]">
            {t("insightEmpty")}
          </p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 size-8 rounded-full bg-[#1488fc]/20 flex items-center justify-center">
                  <TrendingUp className="size-4 text-[#1488fc]" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-[#a0a0a5]"
                    : "bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-[#e5e5e5] border border-gray-200 dark:border-white/5"
                }`}
              >
                {msg.role === "assistant" ? (
                  msg.content.split(/\n\n+/).map((para, j) => (
                    <p key={j} className="mb-2 last:mb-0">
                      {para.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={k} className="font-semibold text-gray-900 dark:text-white">
                            {part.slice(2, -2)}
                          </strong>
                        ) : (
                          <span key={k}>{part}</span>
                        )
                      )}
                    </p>
                  ))
                ) : (
                  <span className="text-xs">{msg.content}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
