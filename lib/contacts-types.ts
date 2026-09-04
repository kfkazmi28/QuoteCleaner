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

// ─── Client profile history ─────────────────────────────────────────────────

export type ClientPayment = {
  id: string
  invoice_title: string
  amount_total: number
  amount_due: number
  status: "draft" | "sent" | "paid" | "canceled"
  due_date: string | null
  paid_at: string | null
  payment_method: string | null
  created_at: string
}

export type ClientAppointment = {
  id: string
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  status: string
  service_type: string | null
  package_name: string | null
  package_price: number | null
  event_type: "quote-linked" | "manual"
}

export type ClientHistory = {
  payments: ClientPayment[]
  appointments: ClientAppointment[]
  totalPaid: number
  outstanding: number
  appointmentCount: number
}
