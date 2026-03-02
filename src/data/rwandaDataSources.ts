/**
 * Rwanda official and reference data used for district cost bands.
 * All band values are derived from these sources so the app uses actual data as provided by Rwanda (or internationally cited for Rwanda).
 *
 * Sources:
 * - NISR (National Institute of Statistics of Rwanda): EICV7 2023/24, poverty & consumption.
 *   https://www.statistics.gov.rw/data-sources/surveys/EICV
 * - NLUDMP 2020-2050: District classification (Kigali, satellite cities, secondary cities, district towns).
 *   Rwanda Land Use and Development Master Plan; 70% urban by 2050; hierarchy: Kigali → Bugesera/Rwamagana/Muhanga → Rubavu/Musanze/Huye/Rusizi/Nyagatare/Karongi/Kayonza/Kirehe → district towns.
 * - Living Income Reference Value (rural Rwanda): Global Living Wage Coalition, 2025 update.
 *   https://globallivingwage.org/reference-value/living-income-reference-value-rural-rwanda/
 *   Used as baseline for "comfortable" monthly cost in low-cost (rural / district town) areas.
 */

/** Living Income Reference Value – rural Rwanda (RWF per month). Source: Global Living Wage Coalition, 2025. */
export const LIRV_RURAL_RWF_PER_MONTH = 299_062;

/**
 * District comfortable monthly cost aligned with lifestyle tiers (Lean/Middle/Upper/Higher).
 * So affordability (income vs cost) matches the same bands: low = Lean range, medium = Middle, high = Upper+.
 */
/** Low-cost districts: top of Lean band (57k–160k) → 160k. */
export const COMFORTABLE_LOW_RWF = 160_000;
/** Medium-cost districts: top of Middle band (161k–650k) → 650k. */
export const COMFORTABLE_MEDIUM_RWF = 650_000;
/** High-cost (Kigali): top of Upper band (650k–2.5M) → 2.5M. */
export const COMFORTABLE_HIGH_RWF = 2_500_000;

/** NLUDMP: Kigali City districts (high cost tier). */
export const KIGALI_DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge"] as const;

/** NLUDMP: Satellite + secondary cities (medium cost tier). */
export const MEDIUM_TIER_DISTRICTS = [
  "Bugesera", "Rwamagana", "Muhanga",           // Satellite (Golden Triangle)
  "Rubavu", "Musanze", "Huye", "Rusizi", "Nyagatare", "Karongi", "Kayonza", "Kirehe", // Secondary
  "Kamonyi", "Burera", "Ngoma", "Rulindo",      // District towns / medium cost
] as const;
