"use client";

import { useRef, useEffect } from "react";
import { Target, TrendingUp } from "lucide-react";
import type { DashboardResult } from "@/engine/computation";
import { computeFIProjection } from "@/engine/fiProjection";
import { getShortenFISuggestions } from "@/engine/fiShortenSuggestions";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

interface FIProjectionChatProps {
  result: DashboardResult | null;
}

function formatRwf(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M RWF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k RWF`;
  return `${n} RWF`;
}

function buildFIChatContent(
  projection: ReturnType<typeof computeFIProjection>,
  shorten: ReturnType<typeof getShortenFISuggestions>,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string[] {
  const lines: string[] = [];
  const tierLabel = t(
    projection.lifestyleTier.tier === "lean"
      ? "tierLean"
      : projection.lifestyleTier.tier === "middle"
        ? "tierMiddle"
        : projection.lifestyleTier.tier === "upper"
          ? "tierUpper"
          : "tierHigher"
  );
  const tierDesc = t(
    projection.lifestyleTier.tier === "lean"
      ? "tierDescLean"
      : projection.lifestyleTier.tier === "middle"
        ? "tierDescMiddle"
        : projection.lifestyleTier.tier === "upper"
          ? "tierDescUpper"
          : "tierDescHigher"
  );

  lines.push(t("fiIntro"));
  lines.push(
    t("fiTargetLine", {
      target: formatRwf(projection.fiTargetRwf),
      annual: formatRwf(projection.annualExpensesRwf),
      withdrawalAnnual: formatRwf(Math.round(projection.fiTargetRwf * 0.04)),
      withdrawalMonthly: formatRwf(Math.round((projection.fiTargetRwf * 0.04) / 12)),
    })
  );

  if (projection.yearsToFI != null && projection.monthlySavingsRwf > 0) {
    lines.push(
      t("fiTimeLine", {
        rate: (projection.savingsRate * 100).toFixed(0),
        savings: formatRwf(projection.monthlySavingsRwf),
        years: String(projection.yearsToFI),
      })
    );
  } else {
    lines.push(t("fiTimeNever"));
  }

  lines.push(t("fiLifestyleLine", { tier: tierLabel, description: tierDesc }));

  if (shorten.isUnrealistic) {
    lines.push(t("fiUnrealisticIntro"));
    for (const opt of shorten.relocateOptions) {
      lines.push(
        t("fiShortenRelocate", {
          district: opt.districtName,
          cost: formatRwf(opt.newMonthlyCostRwf),
          years: String(opt.newYearsToFI),
          saved: String(opt.yearsSaved),
        })
      );
    }
    if (projection.yearsEarlierIfCutExpenses10Pct != null && projection.yearsEarlierIfCutExpenses10Pct > 0) {
      lines.push(
        t("fiShortenCut10", { years: String(projection.yearsEarlierIfCutExpenses10Pct) })
      );
    }
    if (projection.extraSavingsToShaveOneYear != null && projection.extraSavingsToShaveOneYear > 0) {
      lines.push(
        t("fiShortenExtraSavings", { extra: formatRwf(projection.extraSavingsToShaveOneYear) })
      );
    }
    for (const { districtName, suggestion } of shorten.investSuggestions) {
      const title = t(suggestion.titleKey as TranslationKey);
      const body = t(suggestion.bodyKey as TranslationKey, suggestion.params);
      lines.push(t("fiShortenInvest", { district: districtName, title, body }));
    }
  } else {
    switch (projection.primaryLever) {
      case "expense_cut":
        if (projection.yearsEarlierIfCutExpenses10Pct != null) {
          lines.push(
            t("fiLeverExpenseCut", {
              years: String(projection.yearsEarlierIfCutExpenses10Pct),
            })
          );
        } else {
          lines.push(t("fiLeverIncomeRaise"));
        }
        break;
      case "income_raise":
        lines.push(t("fiLeverIncomeRaise"));
        break;
      case "savings_up":
        if (projection.extraSavingsToShaveOneYear != null) {
          lines.push(
            t("fiLeverSavingsUp", {
              extra: formatRwf(projection.extraSavingsToShaveOneYear),
            })
          );
        } else {
          lines.push(t("fiLeverOnTrack"));
        }
        break;
      case "on_track":
        lines.push(t("fiLeverOnTrack"));
        break;
    }
  }

  return lines;
}

function renderParagraphWithBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={k} className="font-semibold text-gray-900 dark:text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={k}>{part}</span>
    )
  );
}

export function FIProjectionChat({ result }: FIProjectionChatProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const projection = result ? computeFIProjection(result) : null;
  const shorten = result && projection ? getShortenFISuggestions(result, projection) : null;
  const content =
    projection && result && shorten
      ? buildFIChatContent(projection, shorten, t)
      : [];
  const userSummary =
    result &&
    `Net worth: ${formatRwf(result.input.netWorthRwf)}, Income: ${formatRwf(result.input.incomeRwf)}, Expenses: ${formatRwf(result.input.expensesRwf)}`;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [content.length]);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/95 backdrop-blur border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col h-[280px] sm:h-[320px] shadow-sm dark:shadow-none">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-white/10">
        <Target className="size-4 text-emerald-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {t("fiProjectionTitle")}
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {!result ? (
          <p className="text-sm text-gray-500 dark:text-[#6a6a6f]">
            {t("fiProjectionEmpty")}
          </p>
        ) : (
          <>
            {userSummary && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-[#a0a0a5]">
                  {userSummary}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex-shrink-0 size-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="size-4 text-emerald-500" />
              </div>
              <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-[#e5e5e5] border border-gray-200 dark:border-white/5">
                {content.map((para, j) => (
                  <p key={j} className="mb-2 last:mb-0">
                    {renderParagraphWithBold(para)}
                  </p>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
