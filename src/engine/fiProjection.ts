/**
 * Deterministic FI (Financial Independence) projection.
 * Uses Rwanda inputs only: net worth, income, expenses.
 * FI target = 25× annual expenses (4% rule). Time to FI = when net worth reaches that target.
 */

import type { DashboardInput, DashboardResult, LifestyleTierBand } from "./computation";
import { DISTRICT_COST_BANDS } from "@/data/districtCostBands";

/** 25× annual expenses = 4% safe withdrawal (Trinity-style). */
export const FI_MULTIPLE = 25;

export interface FIProjection {
  /** FI target in RWF (25× annual expenses). */
  fiTargetRwf: number;
  /** Annual expenses (12 × monthly). */
  annualExpensesRwf: number;
  /** Months until net worth reaches FI target (or null if never). */
  monthsToFI: number | null;
  /** Years until FI (for display). */
  yearsToFI: number | null;
  /** Same as DashboardResult. */
  monthlySavingsRwf: number;
  /** 0..1. */
  savingsRate: number;
  /** From Feature 1. */
  lifestyleTier: LifestyleTierBand;
  /** Main lever to accelerate FI (expense_cut | income_raise | savings_up | on_track). */
  primaryLever: "expense_cut" | "income_raise" | "savings_up" | "on_track";
  /** Optional: extra RWF/month to save to reach FI 1 year earlier (approx). */
  extraSavingsToShaveOneYear: number | null;
  /** If they cut expenses by 10%, how many years earlier would they reach FI? */
  yearsEarlierIfCutExpenses10Pct: number | null;
}

/**
 * Compute months to reach target with monthly contributions (0% real return).
 * FV = netWorth + monthlySavings * n  =>  n = (target - netWorth) / monthlySavings.
 */
function monthsToReachTargetZeroReturn(
  netWorth: number,
  monthlySavings: number,
  target: number
): number | null {
  if (monthlySavings <= 0 || target <= netWorth) return null;
  const n = (target - netWorth) / monthlySavings;
  return n > 0 && Number.isFinite(n) ? Math.ceil(n) : null;
}

/**
 * Compute years earlier to FI if expenses were cut by 10%.
 * New annual expenses = 0.9 * annualExpenses, new FI target = 25 * that, new savings = income - 0.9*expenses.
 */
function yearsEarlierWith10PctExpenseCut(
  input: DashboardInput,
  currentMonthsToFI: number | null
): number | null {
  if (currentMonthsToFI == null || currentMonthsToFI <= 0) return null;
  const newExpenses = input.expensesRwf * 0.9;
  const newAnnualExpenses = newExpenses * 12;
  const newFiTarget = newAnnualExpenses * FI_MULTIPLE;
  const newMonthlySavings = Math.max(0, input.incomeRwf - newExpenses);
  const newMonths = monthsToReachTargetZeroReturn(
    input.netWorthRwf,
    newMonthlySavings,
    newFiTarget
  );
  if (newMonths == null) return null;
  const yearsEarlier = (currentMonthsToFI - newMonths) / 12;
  return yearsEarlier > 0 ? Math.round(yearsEarlier * 10) / 10 : null;
}

/**
 * Approximate extra monthly savings (RWF) needed to reach FI 1 year (12 months) earlier.
 * current: n = (T - NW) / S  =>  T = NW + S*n.
 * want: (n - 12) = (T - NW) / (S + X)  =>  S + X = (T - NW) / (n - 12)  =>  X = (T-NW)/(n-12) - S.
 */
function extraSavingsToShaveOneYear(
  netWorth: number,
  monthlySavings: number,
  target: number,
  monthsToFI: number
): number | null {
  if (monthsToFI <= 12 || monthlySavings <= 0) return null;
  const gap = target - netWorth;
  const newMonths = monthsToFI - 12;
  const requiredMonthly = gap / newMonths;
  const extra = requiredMonthly - monthlySavings;
  return extra > 0 && Number.isFinite(extra) ? Math.ceil(extra) : null;
}

function inferPrimaryLever(savingsRate: number, monthsToFI: number | null): FIProjection["primaryLever"] {
  if (monthsToFI != null && monthsToFI <= 12 * 10 && savingsRate >= 0.2) return "on_track";
  if (savingsRate < 0.1) return "income_raise"; // very low savings → focus on income or expenses
  if (savingsRate < 0.2) return "expense_cut"; // medium → cutting expenses helps a lot
  return "savings_up"; // already decent, small increases in savings rate
}

export function computeFIProjection(result: DashboardResult): FIProjection {
  const { input, monthlySavingsRwf, savingsRate, lifestyleTier } = result;
  const annualExpensesRwf = input.expensesRwf * 12;
  const fiTargetRwf = annualExpensesRwf * FI_MULTIPLE;

  const monthsToFI = monthsToReachTargetZeroReturn(
    input.netWorthRwf,
    monthlySavingsRwf,
    fiTargetRwf
  );
  const yearsToFI = monthsToFI != null ? Math.round((monthsToFI / 12) * 10) / 10 : null;

  const yearsEarlier10 = yearsEarlierWith10PctExpenseCut(input, monthsToFI);
  const extraToShaveOne =
    monthsToFI != null
      ? extraSavingsToShaveOneYear(
          input.netWorthRwf,
          monthlySavingsRwf,
          fiTargetRwf,
          monthsToFI
        )
      : null;

  const primaryLever = inferPrimaryLever(savingsRate, monthsToFI);

  return {
    fiTargetRwf,
    annualExpensesRwf,
    monthsToFI,
    yearsToFI,
    monthlySavingsRwf,
    savingsRate,
    lifestyleTier,
    primaryLever,
    extraSavingsToShaveOneYear: extraToShaveOne,
    yearsEarlierIfCutExpenses10Pct: yearsEarlier10,
  };
}

/** One point on the path to FI: year index (0 = today) and projected net worth (RWF). */
export interface FIGrowthPoint {
  year: number;
  netWorthRwf: number;
}

const MAX_PROJECTION_YEARS = 40;

/**
 * Build series of (year, netWorth) for charting growth toward FI.
 * Year 0 = today; net worth grows by monthlySavings each month (0% real return).
 */
export function buildFIGrowthSeries(projection: FIProjection, netWorthToday: number): FIGrowthPoint[] {
  const points: FIGrowthPoint[] = [{ year: 0, netWorthRwf: netWorthToday }];
  if (projection.monthlySavingsRwf <= 0) {
    return points;
  }
  const maxMonths = projection.monthsToFI != null
    ? Math.min(projection.monthsToFI, MAX_PROJECTION_YEARS * 12)
    : MAX_PROJECTION_YEARS * 12;
  for (let month = 12; month <= maxMonths; month += 12) {
    const netWorth = netWorthToday + projection.monthlySavingsRwf * month;
    points.push({ year: month / 12, netWorthRwf: netWorth });
  }
  return points;
}

/** Years to FI if user lived in that district (expenses = district comfortable cost). */
export interface DistrictYearsToFI {
  district: string;
  yearsToFI: number | null;
  isHighlight: boolean;
}

/**
 * For each district, compute years to FI if user relocated there (expenses = district cost).
 * Returns sorted by years ascending (null last). Top 3 feasible districts marked as highlight.
 */
export function getDistrictYearsToFI(result: DashboardResult): DistrictYearsToFI[] {
  const { input } = result;
  const out: DistrictYearsToFI[] = [];

  for (const d of DISTRICT_COST_BANDS) {
    const cost = d.comfortableCostRwf;
    const newMonthlySavings = Math.max(0, input.incomeRwf - cost);
    const newAnnualExpenses = cost * 12;
    const newFiTarget = newAnnualExpenses * FI_MULTIPLE;
    let yearsToFI: number | null = null;
    if (newMonthlySavings > 0 && newFiTarget > input.netWorthRwf) {
      const months = Math.ceil((newFiTarget - input.netWorthRwf) / newMonthlySavings);
      if (Number.isFinite(months) && months > 0) {
        yearsToFI = Math.round((months / 12) * 10) / 10;
      }
    }
    out.push({ district: d.name, yearsToFI, isHighlight: false });
  }

  out.sort((a, b) => {
    if (a.yearsToFI == null && b.yearsToFI == null) return 0;
    if (a.yearsToFI == null) return 1;
    if (b.yearsToFI == null) return -1;
    return a.yearsToFI - b.yearsToFI;
  });

  let highlightCount = 0;
  for (const row of out) {
    if (row.yearsToFI != null && highlightCount < 3) {
      row.isHighlight = true;
      highlightCount++;
    }
  }
  return out;
}
