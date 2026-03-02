/**
 * Rwanda district cost bands (RWF) from actual data as provided by Rwanda.
 * Tier classification: NLUDMP 2020-2050 (Kigali, satellite/secondary cities, district towns).
 * Comfortable monthly cost: derived from NISR EICV and Living Income Reference Value (rural Rwanda).
 * See rwandaDataSources.ts for sources and constants.
 */

import {
  COMFORTABLE_HIGH_RWF,
  COMFORTABLE_LOW_RWF,
  COMFORTABLE_MEDIUM_RWF,
  KIGALI_DISTRICTS,
  MEDIUM_TIER_DISTRICTS,
} from "./rwandaDataSources";

export type CostTier = "high" | "medium" | "low";

export interface DistrictCost {
  name: string;
  tier: CostTier;
  /** Monthly comfortable cost in RWF (from Rwanda data sources) */
  comfortableCostRwf: number;
}

/** All 30 Rwanda districts (official: NISR/administrative structure). Districts not in Kigali or medium list are low tier. */
const ALL_DISTRICTS: readonly string[] = [
  "Gasabo", "Kicukiro", "Nyarugenge",
  "Bugesera", "Burera", "Gakenke", "Gatsibo", "Gicumbi", "Gisagara", "Huye",
  "Kamonyi", "Karongi", "Kayonza", "Kirehe", "Musanze", "Ngoma", "Ngororero",
  "Nyagatare", "Nyabihu", "Nyamagabe", "Nyamasheke", "Nyanza", "Nyaruguru", "Ruhango",
  "Rusizi", "Rutsiro", "Rwamagana", "Muhanga", "Rubavu", "Rulindo", "Ruyigi",
];

const kigaliSet = new Set(KIGALI_DISTRICTS);
const mediumSet = new Set(MEDIUM_TIER_DISTRICTS);

function buildDistrictCostBands(): DistrictCost[] {
  return (ALL_DISTRICTS as unknown as string[]).map((name) => {
    if (kigaliSet.has(name as (typeof KIGALI_DISTRICTS)[number])) {
      return { name, tier: "high" as CostTier, comfortableCostRwf: COMFORTABLE_HIGH_RWF };
    }
    if (mediumSet.has(name as (typeof MEDIUM_TIER_DISTRICTS)[number])) {
      return { name, tier: "medium" as CostTier, comfortableCostRwf: COMFORTABLE_MEDIUM_RWF };
    }
    return { name, tier: "low" as CostTier, comfortableCostRwf: COMFORTABLE_LOW_RWF };
  });
}

export const DISTRICT_COST_BANDS: DistrictCost[] = buildDistrictCostBands();

/**
 * GeoJSON for Rwanda districts. Loaded from same origin (no CORS).
 * Bundled file: public/rwanda-districts.geojson (simplified shapes).
 */
export const RWANDA_DISTRICTS_GEOJSON_URL = "/rwanda-districts.geojson";

/** Rwanda center [lat, lng] for programmatic re-centering. */
export const RWANDA_CENTER: [number, number] = [-1.94, 29.87];
/** Rwanda approximate bounds [[south, west], [north, east]]. */
export const RWANDA_BOUNDS: [[number, number], [number, number]] = [
  [-2.84, 28.86],
  [-1.05, 30.89],
];

export function getDistrictCostByName(name: string): DistrictCost | undefined {
  const normalized = name.trim();
  return DISTRICT_COST_BANDS.find(
    (d) => d.name.toLowerCase() === normalized.toLowerCase()
  );
}
