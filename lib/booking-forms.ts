import type { PricingSettings, TierKey } from "@/lib/pricing"

export interface BookingForm {
  id: string
  user_id: string
  slug: string
  name: string
  title: string
  intro: string | null
  business_name: string | null
  settings_snapshot: PricingSettings
  source_calculator_id: string | null
  is_active: boolean
  submissions_count: number
  created_at: string
  updated_at: string
}

/** What the public page is allowed to see — never includes pricing settings. */
export interface PublicBookingForm {
  id: string
  slug: string
  title: string
  intro: string | null
  business_name: string | null
  is_active: boolean
}

export type TimeWindow = "morning" | "afternoon" | "evening" | "flexible"

export const TIME_WINDOWS: { value: TimeWindow; label: string; hint: string }[] = [
  { value: "morning", label: "Morning", hint: "8am – 12pm" },
  { value: "afternoon", label: "Afternoon", hint: "12pm – 4pm" },
  { value: "evening", label: "Evening", hint: "4pm – 7pm" },
  { value: "flexible", label: "Flexible", hint: "Any time works" },
]

export function timeWindowLabel(v: string | null | undefined) {
  return TIME_WINDOWS.find((t) => t.value === v)?.label ?? (v ?? "")
}

export interface BookingHomeDetails {
  squareFootage: string
  sqftUnit: "sqft" | "sqm"
  cleanLevel: "1" | "2" | "3"
  bedrooms: string
  bathrooms: string
  pets: string
  children: string
}

export interface BookingClientDetails {
  name: string
  email: string
  phone: string
  address: string
  preferredDate: string // YYYY-MM-DD
  timeWindow: TimeWindow
  notes: string
}

export interface BookingSubmission {
  slug: string
  home: BookingHomeDetails
  client: BookingClientDetails
  tier: TierKey
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}
