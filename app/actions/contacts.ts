"use server"

import { createClient } from "@/lib/supabase/server"
import {
  DEFAULT_AVAILABILITY,
  type ClientContact,
  type EmployeeContact,
  type Availability,
  type ClientHistory,
  type ClientPayment,
  type ClientAppointment,
} from "@/lib/contacts-types"

// ─── Client Contacts ──────────────────────────────────────────────────────────

export async function getClientContacts(): Promise<ClientContact[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("client_contacts")
    .select("*")
    .order("name", { ascending: true })
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function createClientContact(input: {
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}): Promise<{ data?: ClientContact; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data, error } = await supabase
    .from("client_contacts")
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function updateClientContact(
  id: string,
  input: Partial<Omit<ClientContact, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("client_contacts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: error.message }
  return {}
}

export async function deleteClientContact(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("client_contacts").delete().eq("id", id)
  if (error) return { error: error.message }
  return {}
}

export async function updateClientActiveStatus(id: string, isActive: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("client_contacts")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: error.message }
  return {}
}

export async function importClientContacts(
  rows: Array<{ name: string; email?: string; phone?: string; address?: string; notes?: string }>
): Promise<{ imported: number; skipped: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { imported: 0, skipped: 0, error: "Not authenticated" }

  // Fetch existing emails + phones to deduplicate
  const { data: existing } = await supabase
    .from("client_contacts")
    .select("email, phone")
    .eq("user_id", user.id)

  const existingEmails = new Set((existing ?? []).map(r => r.email?.toLowerCase()).filter(Boolean))
  const existingPhones = new Set((existing ?? []).map(r => r.phone?.replace(/\D/g, "")).filter(Boolean))

  const toInsert: Array<{ user_id: string; name: string; email?: string; phone?: string; address?: string; notes?: string }> = []
  let skipped = 0

  for (const row of rows.slice(0, 1000)) {
    if (!row.name?.trim()) { skipped++; continue }

    const emailKey = row.email?.toLowerCase()
    const phoneKey = row.phone?.replace(/\D/g, "")

    if (emailKey && existingEmails.has(emailKey)) { skipped++; continue }
    if (phoneKey && existingPhones.has(phoneKey)) { skipped++; continue }

    toInsert.push({
      user_id: user.id,
      name: row.name.trim(),
      ...(row.email ? { email: row.email.trim() } : {}),
      ...(row.phone ? { phone: row.phone.trim() } : {}),
      ...(row.address ? { address: row.address.trim() } : {}),
      ...(row.notes ? { notes: row.notes.trim() } : {}),
    })

    if (emailKey) existingEmails.add(emailKey)
    if (phoneKey) existingPhones.add(phoneKey)
  }

  if (toInsert.length === 0) return { imported: 0, skipped }

  const { error } = await supabase.from("client_contacts").insert(toInsert)
  if (error) return { imported: 0, skipped, error: error.message }

  return { imported: toInsert.length, skipped }
}

// ─── Client profile history ────────────────────────────────────────────────────

// Fetches a client's payment (invoice) and appointment (calendar) history.
// There is no client_id foreign key, so records are matched by email, phone,
// or name — the same identifiers used elsewhere to detect active clients.
export async function getClientHistory(identifiers: {
  name?: string | null
  email?: string | null
  phone?: string | null
}): Promise<ClientHistory> {
  const empty: ClientHistory = { payments: [], appointments: [], totalPaid: 0, outstanding: 0, appointmentCount: 0 }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return empty

  const wantName = identifiers.name?.toLowerCase().trim() || null
  const wantEmail = identifiers.email?.toLowerCase().trim() || null
  const wantPhone = identifiers.phone?.replace(/\D/g, "") || null
  if (!wantName && !wantEmail && !wantPhone) return empty

  const matches = (name?: string | null, email?: string | null, phone?: string | null) => {
    if (wantEmail && email && email.toLowerCase().trim() === wantEmail) return true
    if (wantPhone && phone && phone.replace(/\D/g, "") === wantPhone) return true
    // Name is the weakest signal — only use it when there is no stronger identifier on the record
    if (wantName && name && name.toLowerCase().trim() === wantName) return true
    return false
  }

  const [invoicesRes, eventsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_title, amount_total, amount_due, status, due_date, paid_at, payment_method, created_at, client_name, client_email, client_phone")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("calendar_events")
      .select("id, scheduled_date, start_time, end_time, status, service_type, package_name, package_price, event_type, client_name, client_email, client_phone, quote:saved_quotes(client_name, client_email, client_phone)")
      .eq("user_id", user.id)
      .order("scheduled_date", { ascending: false }),
  ])

  const payments: ClientPayment[] = []
  let totalPaid = 0
  let outstanding = 0
  for (const inv of invoicesRes.data ?? []) {
    if (!matches(inv.client_name, inv.client_email, inv.client_phone)) continue
    if (inv.status === "canceled") continue
    payments.push({
      id: inv.id,
      invoice_title: inv.invoice_title,
      amount_total: inv.amount_total,
      amount_due: inv.amount_due,
      status: inv.status,
      due_date: inv.due_date,
      paid_at: inv.paid_at,
      payment_method: inv.payment_method,
      created_at: inv.created_at,
    })
    if (inv.status === "paid") totalPaid += inv.amount_total ?? 0
    else outstanding += inv.amount_due ?? 0
  }

  const appointments: ClientAppointment[] = []
  for (const ev of eventsRes.data ?? []) {
    const quote = ev.quote as { client_name: string | null; client_email: string | null; client_phone: string | null } | null
    const name = ev.event_type === "manual" ? ev.client_name : quote?.client_name
    const email = ev.event_type === "manual" ? ev.client_email : quote?.client_email
    const phone = ev.event_type === "manual" ? ev.client_phone : quote?.client_phone
    if (!matches(name, email, phone)) continue
    appointments.push({
      id: ev.id,
      scheduled_date: ev.scheduled_date,
      start_time: ev.start_time,
      end_time: ev.end_time,
      status: ev.status,
      service_type: ev.service_type,
      package_name: ev.package_name,
      package_price: ev.package_price,
      event_type: ev.event_type,
    })
  }

  return { payments, appointments, totalPaid, outstanding, appointmentCount: appointments.length }
}

// ─── Employee Contacts ────────────────────────────────────────────────────────

export async function getEmployeeContacts(): Promise<EmployeeContact[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employee_contacts")
    .select("*")
    .order("name", { ascending: true })
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function createEmployeeContact(input: {
  name: string
  email?: string
  phone?: string
  role?: string
  notes?: string
  availability?: Availability
}): Promise<{ data?: EmployeeContact; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data, error } = await supabase
    .from("employee_contacts")
    .insert({
      ...input,
      user_id: user.id,
      availability: input.availability ?? DEFAULT_AVAILABILITY,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function updateEmployeeContact(
  id: string,
  input: Partial<Omit<EmployeeContact, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("employee_contacts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: error.message }
  return {}
}

export async function deleteEmployeeContact(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("employee_contacts").delete().eq("id", id)
  if (error) return { error: error.message }
  return {}
}
