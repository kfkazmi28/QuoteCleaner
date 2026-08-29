"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CalendarEvent {
  id: string
  user_id: string
  quote_id: string | null
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
  // package/pricing fields
  package_name: string | null
  package_price: number | null
  // manual appointment fields
  event_type: "quote-linked" | "manual"
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  service_type: string | null
  recurrence_rule: "weekly" | "biweekly" | "monthly" | null
  recurrence_end_date: string | null
  recurrence_occurrences: number | null
  // joined from saved_quotes
  quote?: {
    id: string
    quote_name: string
    home_address: string
    client_name: string | null
    client_email: string | null
    client_phone: string | null
    result_standard: number
    result_deep_clean: number
    result_move_in: number
  } | null
}

export interface CreateEventInput {
  quote_id?: string
  scheduled_date: string
  start_time?: string
  end_time?: string
  notes?: string
  package_name?: string
  package_price?: number
  cleaner_id?: string
  cleaner_ids?: string[]
  // manual appointment fields
  event_type?: "quote-linked" | "manual"
  client_name?: string
  client_email?: string
  client_phone?: string
  service_type?: string
  recurrence_rule?: "weekly" | "biweekly" | "monthly"
  recurrence_end_date?: string
  recurrence_occurrences?: number
}

export async function getCalendarEvents(year: number, month: number) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: "Not authenticated" }

  // Build date range for the month
  const from = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  const { data, error } = await supabase
    .from("calendar_events")
    .select(`
      *,
      quote:saved_quotes(id, quote_name, home_address, client_name, client_email, client_phone, result_standard, result_deep_clean, result_move_in)
    `)
    .eq("user_id", user.id)
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .order("scheduled_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true })

  return { data: data as CalendarEvent[] | null, error: error?.message ?? null }
}

export async function getUpcomingEvents(limit = 5) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: "Not authenticated" }

  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("calendar_events")
    .select(`
      *,
      quote:saved_quotes(quote_name, home_address, client_name, client_phone, result_standard, result_deep_clean, result_move_in)
    `)
    .eq("user_id", user.id)
    .gte("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true })
    .limit(limit)

  return { data: data as CalendarEvent[] | null, error: error?.message ?? null }
}

export async function createCalendarEvent(input: CreateEventInput) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: "Not authenticated" }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      quote_id: input.quote_id ?? null,
      scheduled_date: input.scheduled_date,
      start_time: input.start_time ?? null,
      end_time: input.end_time ?? null,
      notes: input.notes ?? null,
      package_name: input.package_name ?? null,
      package_price: input.package_price ?? null,
      cleaner_id: input.cleaner_id ?? null,
      cleaner_ids: input.cleaner_ids ?? [],
      status: "scheduled",
      event_type: input.event_type ?? "quote-linked",
      client_name: input.client_name ?? null,
      client_email: input.client_email ?? null,
      client_phone: input.client_phone ?? null,
      service_type: input.service_type ?? null,
      recurrence_rule: input.recurrence_rule ?? null,
      recurrence_end_date: input.recurrence_end_date ?? null,
      recurrence_occurrences: input.recurrence_occurrences ?? null,
    })
    .select()
    .single()

  if (!error) revalidatePath("/dashboard/calendar")
  return { data, error: error?.message ?? null }
}

export async function updateCalendarEvent(id: string, input: Partial<CreateEventInput> & { status?: string }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: "Not authenticated" }

  const { data, error } = await supabase
    .from("calendar_events")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (!error) revalidatePath("/dashboard/calendar")
  return { data, error: error?.message ?? null }
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (!error) revalidatePath("/dashboard/calendar")
  return { error: error?.message ?? null }
}

export interface SavedQuoteSearchResult {
  id: string
  quote_name: string | null
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  home_address: string | null
  result_standard: number | null
  result_deep_clean: number | null
  result_move_in: number | null
  preferred_package: string | null
}

export async function searchSavedQuotes(query: string): Promise<SavedQuoteSearchResult[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("saved_quotes")
    .select("id, quote_name, client_name, client_email, client_phone, home_address, result_standard, result_deep_clean, result_move_in, preferred_package")
    .eq("user_id", user.id)
    .or(`quote_name.ilike.%${query}%,client_name.ilike.%${query}%,home_address.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(8)

  return (data ?? []) as SavedQuoteSearchResult[]
}

export interface ScheduledDateEvent {
  id: string
  quote_name: string | null
  home_address: string | null
  start_time: string | null
  end_time: string | null
  package_name: string | null
}

export async function getScheduledDatesWithEvents(): Promise<Record<string, ScheduledDateEvent[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from("calendar_events")
    .select("id, scheduled_date, start_time, end_time, package_name, saved_quotes(quote_name, home_address)")
    .eq("user_id", user.id)
    .order("start_time", { ascending: true, nullsFirst: true })

  const dateMap: Record<string, ScheduledDateEvent[]> = {}
  for (const row of data ?? []) {
    const d = row.scheduled_date
    const quote = row.saved_quotes as { quote_name: string | null; home_address: string | null } | null
    const event: ScheduledDateEvent = {
      id: row.id,
      quote_name: quote?.quote_name ?? null,
      home_address: quote?.home_address ?? null,
      start_time: row.start_time,
      end_time: row.end_time,
      package_name: row.package_name,
    }
    if (!dateMap[d]) dateMap[d] = []
    dateMap[d].push(event)
  }
  return dateMap
}

export async function getScheduledQuoteIds(): Promise<Set<string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Set()

  const { data } = await supabase
    .from("calendar_events")
    .select("quote_id")
    .eq("user_id", user.id)
    .not("quote_id", "is", null)

  return new Set((data ?? []).map((r: { quote_id: string }) => r.quote_id))
}

export interface ScheduledEventInfo {
  id: string
  quote_id: string
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  package_name: string | null
  package_price: number | null
  cleaner_ids: string[] | null
}

export async function getScheduledEventsMap(): Promise<Map<string, ScheduledEventInfo>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Map()

  const { data } = await supabase
    .from("calendar_events")
    .select("id, quote_id, scheduled_date, start_time, end_time, package_name, package_price, cleaner_ids")
    .eq("user_id", user.id)
    .not("quote_id", "is", null)

  const map = new Map<string, ScheduledEventInfo>()
  for (const row of data ?? []) {
    if (row.quote_id) {
      map.set(row.quote_id, row as ScheduledEventInfo)
    }
  }
  return map
}

// Get all client names/emails/phones that have calendar events (for active client detection)
export async function getActiveClientIdentifiers(): Promise<{
  names: Set<string>
  emails: Set<string>
  phones: Set<string>
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { names: new Set(), emails: new Set(), phones: new Set() }

  // Get from manual events
  const { data: manualEvents } = await supabase
    .from("calendar_events")
    .select("client_name, client_email, client_phone")
    .eq("user_id", user.id)
    .eq("event_type", "manual")

  // Get from quote-linked events via saved_quotes
  const { data: quoteEvents } = await supabase
    .from("calendar_events")
    .select("quote:saved_quotes(client_name, client_email, client_phone)")
    .eq("user_id", user.id)
    .eq("event_type", "quote-linked")
    .not("quote_id", "is", null)

  const names = new Set<string>()
  const emails = new Set<string>()
  const phones = new Set<string>()

  // Process manual events
  for (const event of manualEvents ?? []) {
    if (event.client_name) names.add(event.client_name.toLowerCase().trim())
    if (event.client_email) emails.add(event.client_email.toLowerCase().trim())
    if (event.client_phone) phones.add(event.client_phone.replace(/\D/g, ""))
  }

  // Process quote-linked events
  for (const event of quoteEvents ?? []) {
    const quote = event.quote as { client_name: string | null; client_email: string | null; client_phone: string | null } | null
    if (quote?.client_name) names.add(quote.client_name.toLowerCase().trim())
    if (quote?.client_email) emails.add(quote.client_email.toLowerCase().trim())
    if (quote?.client_phone) phones.add(quote.client_phone.replace(/\D/g, ""))
  }

  return { names, emails, phones }
}
