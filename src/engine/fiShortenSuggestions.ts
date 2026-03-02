/**
 * Suggestions to get to Financial Independence in 20 years or less.
 * When years-to-FI > 20 we treat it as unrealistic; this module suggests ways to shorten
 * the timeline (relocate, cut expenses, invest per NLUDMP) so the user can get there in ≤20 years.
 */

import type { DashboardResult } from "./computation";
import type { FIProjection } from "./fiProjection";
import { FI_MULTIPLE } from "./fiProjection";
import { getSuggestionsForDistrict } from "@/data/nludmpSuggestions";
import type { InvestmentSuggestion } from "@/data/nludmpSuggestions";

export const UNREALISTIC_FI_YEARS = 20;

export interface RelocateOption {
  districtName: string;
  /** Monthly cost there (comfortable) in RWF */
  newMonthlyCostRwf: number;
  /** Years to FI if they moved there */
  newYearsToFI: number;
  /** Years saved vs current path */
  yearsSaved: number;
}

export interface ShortenFISuggestions {
  isUnrealistic: boolean;
  relocateOptions: RelocateOption[];
  /** 1–2 NLUDMP investment suggestions (district + suggestion) for where they can invest */
  investSuggestions: { districtName: string; suggestion: InvestmentSuggestion }[];
}

/**
 * Relocate: districts where user's income is "strong" and district cost < current expenses.
 * Compute new years to FI if they moved there (expenses = district cost).
 */
function getRelocateOptions(result: DashboardResult, projection: FIProjection): RelocateOption[] {
  if (projection.monthsToFI == null || projection.monthsToFI <= 0) return [];
  const { input, districtAffordability } = result;
  const options: RelocateOption[] = [];

  for (const aff of districtAffordability) {
    if (aff.level !== "strong") continue;
    const cost = aff.district.comfortableCostRwf;
    if (cost >= input.expensesRwf) continue; // no expense cut

    const newMonthlySavings = Math.max(0, input.incomeRwf - cost);
    const newAnnualExpenses = cost * 12;
    const newFiTarget = newAnnualExpenses * FI_MULTIPLE;
    if (newMonthlySavings <= 0 || newFiTarget <= input.netWorthRwf) continue;
    const newMonths = Math.ceil((newFiTarget - input.netWorthRwf) / newMonthlySavings);
    if (!Number.isFinite(newMonths) || newMonths <= 0) continue;
    const newYearsToFI = Math.round((newMonths / 12) * 10) / 10;
    const yearsSaved = (projection.monthsToFI - newMonths) / 12;
    if (yearsSaved <= 0) continue;
    options.push({
      districtName: aff.district.name,
      newMonthlyCostRwf: cost,
      newYearsToFI,
      yearsSaved: Math.round(yearsSaved * 10) / 10,
    });
  }
  options.sort((a, b) => b.yearsSaved - a.yearsSaved);
  return options.slice(0, 3);
}

/**
 * Pick 1–2 NLUDMP investment suggestions from districts where user is strong or stable.
 */
function getInvestSuggestions(result: DashboardResult): { districtName: string; suggestion: InvestmentSuggestion }[] {
  const out: { districtName: string; suggestion: InvestmentSuggestion }[] = [];
  const seen = new Set<string>();

  for (const aff of result.districtAffordability) {
    if (aff.level !== "strong" && aff.level !== "stable") continue;
    const suggestions = getSuggestionsForDistrict(
      aff.district.name,
      aff.district.tier,
      aff.level,
      result.monthlySavingsRwf
    );
    for (const s of suggestions) {
      const key = `${s.titleKey}-${aff.district.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ districtName: aff.district.name, suggestion: s });
      if (out.length >= 2) return out;
    }
  }
  return out;
}

export function getShortenFISuggestions(
  result: DashboardResult,
  projection: FIProjection
): ShortenFISuggestions {
  const isUnrealistic =
    projection.yearsToFI == null || projection.yearsToFI > UNREALISTIC_FI_YEARS;
  const relocateOptions = getRelocateOptions(result, projection);
  const investSuggestions = getInvestSuggestions(result);

  return {
    isUnrealistic,
    relocateOptions,
    investSuggestions,
  };
}
