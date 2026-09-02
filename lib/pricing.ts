// Shared cleaning-quote pricing engine.
// Used by the dashboard calculator AND public booking forms so both produce
// identical numbers from the same settings. Pure — safe on server and client.

export interface PricingSettings {
  hourlyRate: number
  bedroomMinutes: number
  bathroomMinutes: number
  petFeeMinutes: number
  childrenFeeMinutes: number
  sqftMultiplier: number
  moveInExtraHours: number
  standardCleanDiscount: number
  monthlyDiscount: number
  biweeklyDiscount: number
  weeklyDiscount: number
  minimumQuotePrice: number
  travelFee: number
}

export const defaultPricingSettings: PricingSettings = {
  hourlyRate: 50,
  bedroomMinutes: 20,
  bathroomMinutes: 25,
  petFeeMinutes: 15,
  childrenFeeMinutes: 10,
  sqftMultiplier: 0.05,
  moveInExtraHours: 2,
  standardCleanDiscount: 20,
  monthlyDiscount: 5,
  biweeklyDiscount: 10,
  weeklyDiscount: 15,
  minimumQuotePrice: 80,
  travelFee: 0,
}

export type SqftUnit = "sqft" | "sqm"
export const SQ_FT_PER_SQ_M = 10.7639

export interface HomeInput {
  squareFootage: number // already in square feet
  cleanLevel: "1" | "2" | "3" | string
  bedrooms: number
  bathrooms: number
  pets: number
  children: number
}

export interface QuoteResults {
  deepClean: number
  moveInMoveOut: number
  standardSingle: number
  monthly: number
  biweekly: number
  weekly: number
  totalHours: number
}

export const CLEAN_LEVEL_MINUTES: Record<string, number> = { "1": 60, "2": 120, "3": 180 }
export const CLEAN_LEVEL_LABELS: Record<string, string> = { "1": "Light Clean", "2": "Medium Clean", "3": "Heavy Clean" }

export function toSquareFeet(value: number, unit: SqftUnit) {
  return unit === "sqm" ? value * SQ_FT_PER_SQ_M : value
}

/** Coerce anything (jsonb snapshot, partial object) into a full PricingSettings. */
export function normalizeSettings(raw: unknown): PricingSettings {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const out = { ...defaultPricingSettings }
  for (const k of Object.keys(defaultPricingSettings) as (keyof PricingSettings)[]) {
    const v = Number(obj[k])
    if (Number.isFinite(v)) out[k] = v
  }
  return out
}

/**
 * The canonical quote formula. Mirrors the dashboard calculator exactly.
 */
export function calculateQuote(input: HomeInput, settings: PricingSettings): QuoteResults {
  const totalMinutes =
    input.squareFootage * settings.sqftMultiplier +
    (CLEAN_LEVEL_MINUTES[input.cleanLevel] || 120) +
    input.bedrooms * settings.bedroomMinutes +
    input.bathrooms * settings.bathroomMinutes +
    input.pets * settings.petFeeMinutes +
    input.children * settings.childrenFeeMinutes

  const totalHours = totalMinutes / 60
  const deepClean = Math.round(totalHours * settings.hourlyRate)
  const moveInMoveOut = Math.round((totalHours + 2) * settings.hourlyRate)
  const standardSingle = Math.round(deepClean * 0.8)
  const monthly = Math.round(standardSingle * 0.95)
  const biweekly = Math.round(standardSingle * 0.9)
  const weekly = Math.round(standardSingle * 0.85)

  return { deepClean, moveInMoveOut, standardSingle, monthly, biweekly, weekly, totalHours }
}

export type TierKey = "move" | "deep" | "standard" | "monthly" | "biweekly" | "weekly"

export interface TierCard {
  key: TierKey
  label: string
  subtitle: string
  price: number
  hours: number
  recurring: boolean
}

/** Same six cards the dashboard calculator shows. */
export function buildTierCards(results: QuoteResults): TierCard[] {
  return [
    { key: "move", label: "Move In / Move Out", subtitle: "Extra time for vacant properties", price: results.moveInMoveOut, hours: results.totalHours + 2, recurring: false },
    { key: "deep", label: "Deep Clean", subtitle: "One-time thorough cleaning", price: results.deepClean, hours: results.totalHours, recurring: false },
    { key: "standard", label: "Single", subtitle: "One-time regular cleaning", price: results.standardSingle, hours: results.totalHours * 0.85, recurring: false },
    { key: "monthly", label: "Monthly", subtitle: "Once a month service", price: results.monthly, hours: results.totalHours * 0.85, recurring: true },
    { key: "biweekly", label: "Bi-weekly", subtitle: "Every two weeks service", price: results.biweekly, hours: results.totalHours * 0.8, recurring: true },
    { key: "weekly", label: "Weekly", subtitle: "Weekly recurring service", price: results.weekly, hours: results.totalHours * 0.75, recurring: true },
  ]
}

export const TIER_LABELS: Record<TierKey, string> = {
  move: "Move In / Move Out",
  deep: "Deep Clean",
  standard: "Single",
  monthly: "Monthly",
  biweekly: "Bi-weekly",
  weekly: "Weekly",
}
