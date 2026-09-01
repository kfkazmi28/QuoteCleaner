"use server"

import { createClient } from "@/lib/supabase/server"
import { PricingSettings } from "@/contexts/pricing-settings-context"

export interface SaveQuoteInput {
  quote_name: string
  home_address: string
  notes?: string
  client_name?: string
  client_email?: string
  client_phone?: string
  quote_generated_by?: string
  square_footage: string
  clean_level: string
  bedrooms: string
  bathrooms: string
  pets: string
  children: string
  hourly_rate: number
  result_move_in: number
  result_deep_clean: number
  result_standard: number
  result_monthly: number
  result_biweekly: number
  result_weekly: number
  settings_snapshot: PricingSettings
  preferred_package?: string
  status?: string
  checklist_data?: {
    standard?: { section: string; items: string[] }[]
    deep?: { section: string; items: string[] }[]
    move?: { section: string; items: string[] }[]
  } | null
}

export async function saveQuote(input: SaveQuoteInput) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: "Not authenticated" }

  const payload: Record<string, unknown> = { user_id: user.id, ...input }

  let { data, error } = await supabase
    .from("saved_quotes")
    .insert(payload)
    .select()
    .single()

  // If the checklist_data column doesn't exist yet, retry without it so the
  // save still succeeds — the column can be added via scripts/add-checklist-data.sql
  if (error && (error.message.includes("checklist_data") || (error as any).code === "42703")) {
    const { checklist_data: _stripped, ...payloadWithoutChecklist } = payload
    ;({ data, error } = await supabase
      .from("saved_quotes")
      .insert(payloadWithoutChecklist)
      .select()
      .single())
  }

  if (error) return { error: error.message }

  // Auto-upsert contact if a client name is provided
  if (input.client_name?.trim()) {
    // Check if a contact with this name already exists for this user
    const { data: existing } = await supabase
      .from("client_contacts")
      .select("id, phone, email, address")
      .eq("user_id", user.id)
      .ilike("name", input.client_name.trim())
      .maybeSingle()

    if (existing) {
      // Only fill in missing fields — don't overwrite existing data
      const updates: Record<string, string> = {}
      if (!existing.phone && input.client_phone) updates.phone = input.client_phone
      if (!existing.email && input.client_email) updates.email = input.client_email
      if (!existing.address && input.home_address) updates.address = input.home_address
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()
        await supabase.from("client_contacts").update(updates).eq("id", existing.id)
      }
    } else {
      await supabase.from("client_contacts").insert({
        user_id: user.id,
        name: input.client_name.trim(),
        phone: input.client_phone ?? null,
        email: input.client_email ?? null,
        address: input.home_address ?? null,
        notes: input.notes ?? null,
      })
    }
  }

  return { data }
}

export async function updateQuote(id: string, input: Partial<SaveQuoteInput>) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: "Not authenticated" }

  const updatePayload: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() }

  let { data, error } = await supabase
    .from("saved_quotes")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  // Retry without checklist_data if the column doesn't exist yet
  if (error && (error.message.includes("checklist_data") || (error as any).code === "42703")) {
    const { checklist_data: _stripped, ...payloadWithoutChecklist } = updatePayload
    ;({ data, error } = await supabase
      .from("saved_quotes")
      .update(payloadWithoutChecklist)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single())
  }

  if (error) return { error: error.message }
  return { data }
}

export async function getSavedQuotes() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: "Not authenticated", data: [] }

  const { data, error } = await supabase
    .from("saved_quotes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data: data ?? [] }
}

export async function deleteQuote(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("saved_quotes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function markQuoteCompleted(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: "Not authenticated" }

  const { data, error } = await supabase
    .from("saved_quotes")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    const isColumnMissing =
      error.message.toLowerCase().includes("status") ||
      (error as any).code === "42703"
    return {
      error: isColumnMissing
        ? "MIGRATION_REQUIRED"
        : error.message,
    }
  }
  return { data }
}

export async function checkQuoteStatusColumn(): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("saved_quotes")
    .select("status")
    .limit(1)
  return !error
}

export async function archiveQuote(id: string, archived: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: "Not authenticated" }

  const { data, error } = await supabase
    .from("saved_quotes")
    .update({ archived, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function getDefaultSenderName(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("user_settings")
    .select("default_sender_name")
    .eq("user_id", user.id)
    .single()

  return data?.default_sender_name ?? null
}

export async function setDefaultSenderName(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: user.id, default_sender_name: name, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )

  return { error: error?.message ?? null }
}
