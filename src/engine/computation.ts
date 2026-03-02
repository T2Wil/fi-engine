/**
 * Local-first computation engine: lifestyle tier, savings, district affordability.
 * All runs client-side.
 */

import {
  DISTRICT_COST_BANDS,
  getDistrictCostByName,
  type DistrictCost,
} from "@/data/districtCostBands";

export type LifestyleTier = "lean" | "middle" | "upper" | "higher";

export interface LifestyleTierBand {
  tier: LifestyleTier;
  minRwf: number;
  maxRwf: number;
  description: string;
}

/** Lean (57k–160k), Middle (161k–650k), Upper (650k–2.5M), Higher (2.5M+). */
export const LIFESTYLE_TIERS: LifestyleTierBand[] = [
  { tier: "lean", minRwf: 57_000, maxRwf: 160_000, description: "57k–160k RWF/month" },
  { tier: "middle", minRwf: 161_000, maxRwf: 650_000, description: "161k–650k RWF/month" },
  { tier: "upper", minRwf: 650_000, maxRwf: 2_500_000, description: "650k–2.5M RWF/month" },
  { tier: "higher", minRwf: 2_500_000, maxRwf: Number.POSITIVE_INFINITY, description: "2.5M+ RWF/month" },
];

export type AffordabilityLevel = "strained" | "stable" | "strong";

export interface DistrictAffordability {
  district: DistrictCost;
  /** income / comfortableCost */
  ratio: number;
  level: AffordabilityLevel;
}

export interface DashboardInput {
  netWorthRwf: number;
  incomeRwf: number;
  expensesRwf: number;
}

export interface DashboardResult {
  input: DashboardInput;
  monthlySavingsRwf: number;
  savingsRate: number; // 0..1
  lifestyleTier: LifestyleTierBand;
  districtAffordability: DistrictAffordability[];
  /** For chart: districts with comfortable cost and user income */
  chartData: { district: string; comfortableCostRwf: number; userIncomeRwf: number }[];
}

function getAffordabilityLevel(ratio: number): AffordabilityLevel {
  if (ratio < 1) return "strained";
  if (ratio <= 1.5) return "stable";
  return "strong";
}

/** Lifestyle band is based on monthly income (earning tier), not expenses. */
function getLifestyleTier(incomeRwf: number): LifestyleTierBand {
  for (const band of LIFESTYLE_TIERS) {
    if (incomeRwf >= band.minRwf && incomeRwf < band.maxRwf) return band;
  }
  return incomeRwf < LIFESTYLE_TIERS[0].minRwf ? LIFESTYLE_TIERS[0] : LIFESTYLE_TIERS[LIFESTYLE_TIERS.length - 1];
}

export function computeDashboard(input: DashboardInput): DashboardResult {
  const { incomeRwf, expensesRwf } = input;
  const monthlySavingsRwf = Math.max(0, incomeRwf - expensesRwf);
  const savingsRate =
    incomeRwf > 0 ? Math.min(1, Math.max(0, monthlySavingsRwf / incomeRwf)) : 0;
  const lifestyleTier = getLifestyleTier(incomeRwf);

  const districtAffordability: DistrictAffordability[] =
    DISTRICT_COST_BANDS.map((district) => {
      const ratio =
        district.comfortableCostRwf > 0
          ? incomeRwf / district.comfortableCostRwf
          : 0;
      return {
        district,
        ratio,
        level: getAffordabilityLevel(ratio),
      };
    });

  const chartData = DISTRICT_COST_BANDS.map((d) => ({
    district: d.name,
    comfortableCostRwf: d.comfortableCostRwf,
    userIncomeRwf: incomeRwf,
  }));

  return {
    input,
    monthlySavingsRwf,
    savingsRate,
    lifestyleTier,
    districtAffordability,
    chartData,
  };
}

/** Resolve district name from GeoJSON property (geoBoundaries uses shapeName or name) */
export function matchDistrictName(geojsonName: string): DistrictCost | undefined {
  return getDistrictCostByName(geojsonName);
}
