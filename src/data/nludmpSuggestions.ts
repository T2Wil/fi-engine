/**
 * Investment suggestions aligned with Rwanda's National Land-Use and Development
 * Master Plan (NLUDMP) 2020-2050.
 * Source: https://www.environment.gov.rw/ (National Land-Use and Development Master Plan 2020-2050)
 *
 * Key plan themes (from public summaries):
 * - Agriculture: 47.2% land allocation; target 15x yield by 2050; food security for ~22M population
 * - Urbanization: 70% urban by 2050; hierarchy (Kigali, satellite cities Bugesera/Rwamagana/Muhanga, secondary cities, district towns)
 * - PUSH: Population, Urbanization, Settlement, Housing, Spatial economy, Manufacturing, Industry, Mining, Agriculture, Environment, Tourism, Transport, Utilities
 * - Land consolidation, climate resilience, middle-income by 2035
 */

import type { CostTier } from "./districtCostBands";
import type { AffordabilityLevel } from "@/engine/computation";

export interface InvestmentSuggestion {
  /** Short title for the suggestion */
  titleKey: string;
  /** Body / bullet text (translation key or key with params) */
  bodyKey: string;
  /** Optional params for bodyKey */
  params?: Record<string, string | number>;
  /** Sector tag for styling */
  sector: "agriculture" | "urban" | "industry" | "tourism" | "climate" | "savings";
}

/** District-level focus by cost tier (NLUDMP alignment) */
const DISTRICT_FOCUS: Record<CostTier, InvestmentSuggestion["sector"][]> = {
  high: ["urban", "industry", "savings"],   // Kigali: urbanization 70%, housing, spatial economy
  medium: ["urban", "tourism", "industry"],  // Satellite/secondary: Rwamagana, Muhanga, Musanze, Rubavu
  low: ["agriculture", "climate", "savings"], // Rural: 47.2% agriculture, 15x yield, land consolidation
};

/**
 * Returns 1–2 investment suggestions for a district based on NLUDMP 2020-2050,
 * the district's cost tier, and the user's affordability in that district.
 */
export function getSuggestionsForDistrict(
  districtName: string,
  costTier: CostTier,
  level: AffordabilityLevel,
  monthlySavingsRwf: number
): InvestmentSuggestion[] {
  const suggestions: InvestmentSuggestion[] = [];
  const sectors = DISTRICT_FOCUS[costTier];

  // Strong: can consider investing in the district
  if (level === "strong" && monthlySavingsRwf >= 100_000) {
    if (sectors.includes("agriculture")) {
      suggestions.push({
        titleKey: "nludmpAgriTitle",
        bodyKey: "nludmpAgriBody",
        params: { district: districtName },
        sector: "agriculture",
      });
    }
    if (sectors.includes("urban")) {
      suggestions.push({
        titleKey: "nludmpUrbanTitle",
        bodyKey: "nludmpUrbanBody",
        params: { district: districtName },
        sector: "urban",
      });
    }
    if (sectors.includes("tourism") && suggestions.length < 2) {
      suggestions.push({
        titleKey: "nludmpTourismTitle",
        bodyKey: "nludmpTourismBody",
        params: { district: districtName },
        sector: "tourism",
      });
    }
    if (sectors.includes("industry") && suggestions.length < 2) {
      suggestions.push({
        titleKey: "nludmpIndustryTitle",
        bodyKey: "nludmpIndustryBody",
        sector: "industry",
      });
    }
    if (sectors.includes("climate") && suggestions.length < 2) {
      suggestions.push({
        titleKey: "nludmpClimateTitle",
        bodyKey: "nludmpClimateBody",
        sector: "climate",
      });
    }
  }

  // Stable or strained: focus on building buffer and NLUDMP-aligned savings
  if (suggestions.length === 0 || level !== "strong") {
    suggestions.push({
      titleKey: "nludmpSavingsTitle",
      bodyKey: "nludmpSavingsBody",
      params: { district: districtName },
      sector: "savings",
    });
  }

  return suggestions.slice(0, 2); // Max 2 per district
}

export const NLUDMP_SOURCE_LABEL = "NLUDMP 2020-2050";
