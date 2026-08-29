"use server"

import { createClient } from "@/lib/supabase/server"
import { DEFAULT_AVAILABILITY, type ClientContact, type EmployeeContact, type Availability } from "@/lib/contacts-types"

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
