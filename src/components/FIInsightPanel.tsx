"use client";

import { useState, Fragment } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { DashboardResult } from "@/engine/computation";
import { computeFIProjection } from "@/engine/fiProjection";
import { getShortenFISuggestions } from "@/engine/fiShortenSuggestions";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { DISTRICT_COST_BANDS } from "@/data/districtCostBands";

interface FIInsightPanelProps {
  readonly result: DashboardResult | null;
}

function formatRwf(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function formatRwfLong(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M RWF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k RWF`;
  return `${n} RWF`;
}

function renderBold(text: string) {
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

export function FIInsightPanel({ result }: FIInsightPanelProps) {
  const { t } = useLanguage();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const noInputProvided =
    !result ||
    (result.input.incomeRwf === 0 &&
      result.input.expensesRwf === 0 &&
      result.input.netWorthRwf === 0);

  if (noInputProvided) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/95 backdrop-blur border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col min-h-[320px] shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/10">
          <MessageCircle className="size-4 text-emerald-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">{t("yourFIInsight")}</span>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-[#6a6a6f]">{t("insightEmpty")}</p>
        </div>
      </div>
    );
  }

  const projection = computeFIProjection(result);
  const shorten = getShortenFISuggestions(result, projection);

  const tierLabel = t(
    result.lifestyleTier.tier === "lean"
      ? "tierLean"
      : result.lifestyleTier.tier === "middle"
        ? "tierMiddle"
        : result.lifestyleTier.tier === "upper"
          ? "tierUpper"
          : "tierHigher"
  );
  const tierDesc = t(
    result.lifestyleTier.tier === "lean"
      ? "tierDescLean"
      : result.lifestyleTier.tier === "middle"
        ? "tierDescMiddle"
        : result.lifestyleTier.tier === "upper"
          ? "tierDescUpper"
          : "tierDescHigher"
  );
  const savingsRatePct = Math.round(result.savingsRate * 100);
  const strong = result.districtAffordability.filter((a) => a.level === "strong");
  const stable = result.districtAffordability.filter((a) => a.level === "stable");
  const strained = result.districtAffordability.filter((a) => a.level === "strained");
  const names = strong.length > 0 ? strong.map((a) => a.district.name).join(", ") : "—";
  const hasNetWorth = result.input.netWorthRwf > 0;
  const hasSavingsRate = savingsRatePct > 0;
  const hasFiTarget = projection.fiTargetRwf > 0;
  const hasMonthlySavings = result.monthlySavingsRwf > 0;
  const hasPathToFI = projection.yearsToFI != null && projection.monthlySavingsRwf > 0;
  const incomePotentialHubs = DISTRICT_COST_BANDS
    .filter((d) => d.tier !== "low")
    .slice(0, 6)
    .map((d) => d.name)
    .join(", ");

  // Build scenario rows for table: Current, Cut 10%, Relocate options
  type ScenarioRow = { labelKey: TranslationKey; labelParam?: Record<string, string>; years: string };
  const scenarioRows: ScenarioRow[] = [];
  if (hasPathToFI) {
    scenarioRows.push({
      labelKey: "scenarioCurrent",
      years: String(projection.yearsToFI!),
    });
    if (projection.yearsEarlierIfCutExpenses10Pct != null && projection.yearsEarlierIfCutExpenses10Pct > 0 && projection.yearsToFI != null) {
      const yearsIfCut = Math.round((projection.yearsToFI - projection.yearsEarlierIfCutExpenses10Pct) * 10) / 10;
      scenarioRows.push({
        labelKey: "scenarioCut10",
        years: String(yearsIfCut),
      });
    }
    for (const opt of shorten.relocateOptions) {
      scenarioRows.push({
        labelKey: "scenarioRelocate",
        labelParam: { district: opt.districtName },
        years: String(opt.newYearsToFI),
      });
    }
  }

  const summaryLine =
    hasPathToFI
      ? projection.yearsToFI! <= 20 && result.savingsRate >= 0.2
        ? t("summaryOnTrack", { tier: tierLabel, years: String(projection.yearsToFI) })
        : t("summaryOneLine", { tier: tierLabel, years: String(projection.yearsToFI) })
      : t("summaryOneLineNever", { tier: tierLabel });

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/95 backdrop-blur border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col min-h-[320px] shadow-sm dark:shadow-none">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/10">
        <MessageCircle className="size-4 text-emerald-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">{t("yourFIInsight")}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Preview: heading + badges + one-line summary */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8a8a8f] mb-2">
            {t("summaryHeading")}
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {hasNetWorth && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-xs font-medium text-gray-700 dark:text-gray-200">
                {t("badgeNetWorth")}: {formatRwf(result.input.netWorthRwf)} RWF
              </span>
            )}
            {hasSavingsRate && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                {t("badgeSavingsRate")}: {savingsRatePct}%
              </span>
            )}
            {hasFiTarget && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-medium">
                {t("badgeFITarget")}: {formatRwf(projection.fiTargetRwf)} RWF
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-[#e5e5e5] leading-relaxed">
            {renderBold(summaryLine)}
          </p>
        </div>

        {/* Progress: savings rate bar — only when there is a rate to show */}
        {hasSavingsRate && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-[#8a8a8f] mb-1">
            <span>{t("badgeSavingsRate")}</span>
            <span>{savingsRatePct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, savingsRatePct)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-[#6a6a6f] mt-0.5">
            {t("savingsRateHint")}
          </p>
        </div>
        )}

        {/* Where you stand: only show lines that have content */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8a8a8f] mb-1.5">
            {t("sectionWhereYouStand")}
          </h3>
          <p className="text-sm text-gray-700 dark:text-[#e5e5e5] leading-relaxed">
            {renderBold(t("insightLifestyle", { tier: tierLabel, description: tierDesc }))}
          </p>
          {hasMonthlySavings && (
          <p className="text-sm text-gray-700 dark:text-[#e5e5e5] leading-relaxed mt-1">
            {renderBold(
              result.savingsRate >= 0.2
                ? t("insightSavingsStrong", {
                    savings: formatRwfLong(result.monthlySavingsRwf),
                    rate: String(savingsRatePct),
                  })
                : result.savingsRate >= 0.1
                  ? t("insightSavingsMedium", {
                      savings: formatRwfLong(result.monthlySavingsRwf),
                      rate: String(savingsRatePct),
                    })
                  : t("insightSavingsLow", {
                      savings: formatRwfLong(result.monthlySavingsRwf),
                      rate: String(savingsRatePct),
                    })
            )}
          </p>
          )}
          {hasNetWorth && (
          <p className="text-sm text-gray-700 dark:text-[#e5e5e5] leading-relaxed mt-1">
            {renderBold(t("insightNetWorth", { amount: formatRwfLong(result.input.netWorthRwf) }))}
          </p>
          )}
        </div>

        {/* Your path to FI: only show when there is a target / path */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8a8a8f] mb-1.5">
            {t("sectionPathToFI")}
          </h3>
          {hasFiTarget && (
          <p className="text-sm text-gray-700 dark:text-[#e5e5e5] leading-relaxed mb-2">
            {renderBold(t("fiTargetLine", {
              target: formatRwfLong(projection.fiTargetRwf),
              annual: formatRwfLong(projection.annualExpensesRwf),
              withdrawalAnnual: formatRwfLong(Math.round(projection.fiTargetRwf * 0.04)),
              withdrawalMonthly: formatRwfLong(Math.round((projection.fiTargetRwf * 0.04) / 12)),
            }))}
          </p>
          )}
          {hasPathToFI ? (
            <p className="text-sm text-gray-700 dark:text-[#e5e5e5] mb-2">
              {renderBold(t("fiTimeLine", {
                rate: String(savingsRatePct),
                savings: formatRwfLong(projection.monthlySavingsRwf),
                years: String(projection.yearsToFI),
              }))}
            </p>
          ) : (
            <p className="text-sm text-gray-700 dark:text-[#e5e5e5] mb-2">{t("fiTimeNever")}</p>
          )}

          {scenarioRows.length > 1 && (
            <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">
                      {t("tableScenario")}
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">
                      {t("tableYearsToFI")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {scenarioRows.map((row, i) => (
                    <tr key={i} className="bg-white dark:bg-[#1e1e22]/50">
                      <td className="py-2 px-3 text-gray-700 dark:text-[#e5e5e5]">
                        {row.labelParam
                          ? t(row.labelKey, row.labelParam)
                          : t(row.labelKey)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-white">
                        {row.years}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* "Ways to get there in 20 years or less": only when years-to-FI > 20; suggestions help reach FI in ≤20 years */}
        {(() => {
          const hasRelocate = shorten.isUnrealistic && shorten.relocateOptions.length > 0;
          const hasCut10 = shorten.isUnrealistic && projection.yearsEarlierIfCutExpenses10Pct != null && projection.yearsEarlierIfCutExpenses10Pct > 0;
          const hasExtra = shorten.isUnrealistic && projection.extraSavingsToShaveOneYear != null && projection.extraSavingsToShaveOneYear > 0;
          const hasInvest = shorten.isUnrealistic && shorten.investSuggestions.length > 0;
          const hasAnyUnrealisticBullet = hasRelocate || hasCut10 || hasExtra || hasInvest;
          const hasOnTrack = !shorten.isUnrealistic;
          if (!hasAnyUnrealisticBullet && !hasOnTrack) return null;
          return (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8a8a8f] mb-1.5">
            {shorten.isUnrealistic ? t("sectionWaysToShorten") : t("sectionPathToFI")}
          </h3>
          <ul className="space-y-1.5 list-none pl-0 text-sm text-gray-700 dark:text-[#e5e5e5]">
            {shorten.isUnrealistic ? (
              <>
                <li className="flex gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>
                    {renderBold(t("bulletRelocateIncomePotential", { hubs: incomePotentialHubs }))}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{renderBold(t("bulletRelocateLowerExpenses"))}</span>
                </li>
                {hasRelocate && shorten.relocateOptions.map((opt, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{renderBold(t("bulletRelocate", {
                      district: opt.districtName,
                      cost: formatRwfLong(opt.newMonthlyCostRwf),
                      years: String(opt.newYearsToFI),
                      saved: String(opt.yearsSaved),
                    }))}</span>
                  </li>
                ))}
                {hasCut10 && (
                    <li className="flex gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{renderBold(t("bulletCut10", { years: String(projection.yearsEarlierIfCutExpenses10Pct!) }))}</span>
                    </li>
                  )}
                {hasExtra && (
                    <li className="flex gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{renderBold(t("bulletExtra", { extra: formatRwfLong(projection.extraSavingsToShaveOneYear!) }))}</span>
                    </li>
                  )}
                {hasInvest && shorten.investSuggestions.map(({ districtName, suggestion }, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{renderBold(t("bulletInvest", { district: districtName, title: t(suggestion.titleKey as TranslationKey) }))}</span>
                  </li>
                ))}
              </>
            ) : (
              <li className="flex gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>{t("bulletOnTrack")}</span>
              </li>
            )}
          </ul>
        </div>
          );
        })()}

        {/* Collapsible: More detail — only when at least one district line has meaning (omit "strong in —", "Stable in 0") */}
        {(() => {
          const parts: React.ReactNode[] = [];
          if (strong.length > 0) parts.push(renderBold(t("detailStrongOnly", { names })));
          if (stable.length > 0) parts.push(renderBold(t("detailStableOnly", { stable: String(stable.length) })));
          if (strained.length > 0) parts.push(renderBold(t("detailStrainedOnly", { strained: String(strained.length) })));
          const hasDetail = parts.length > 0;
          if (!hasDetail) return null;
          return (
        <div className="border-t border-gray-200 dark:border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-[#8a8a8f] hover:text-gray-700 dark:hover:text-gray-200"
          >
            {detailsOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {detailsOpen ? t("collapseDetails") : t("expandDetails")}
          </button>
          {detailsOpen && (
            <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-[#a0a0a5]">
              <p>{parts.map((p, i) => <Fragment key={i}>{i > 0 && " "}{p}</Fragment>)}</p>
              {strained.length > 0 && <p className="text-xs">{t("detailStrainedHint")}</p>}
              {(strong.length > 0 || stable.length > 0) && <p>{t("detailInvestHint")}</p>}
            </div>
          )}
        </div>
          );
        })()}
      </div>
    </div>
  );
}
