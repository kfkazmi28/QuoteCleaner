// Shared types and constants for contacts — safe to import in both server and client code

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

export type DayAvailability = {
  available: boolean
  start: string
  end: string
}

export type Availability = Record<DayKey, DayAvailability>

export const DEFAULT_AVAILABILITY: Availability = {
  mon: { available: true,  start: "08:00", end: "17:00" },
  tue: { available: true,  start: "08:00", end: "17:00" },
  wed: { available: true,  start: "08:00", end: "17:00" },
  thu: { available: true,  start: "08:00", end: "17:00" },
  fri: { available: true,  start: "08:00", end: "17:00" },
  sat: { available: false, start: "08:00", end: "17:00" },
  sun: { available: false, start: "08:00", end: "17:00" },
}

export type ClientContact = {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type EmployeeContact = {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  notes: string | null
  availability: Availability
  created_at: string
  updated_at: string
}
