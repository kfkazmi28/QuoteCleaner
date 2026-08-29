"use server"

import { createClient } from "@/lib/supabase/server"
import type { PricingSettings } from "@/contexts/pricing-settings-context"

export interface SavedCalculator {
  id: string
  name: string
  settings: PricingSettings
  created_at: string
  updated_at: string
}

export async function getSavedCalculators(): Promise<{ data: SavedCalculator[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { data: [], error: "Not authenticated" }

  const { data, error } = await supabase
    .from("saved_calculators")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true })

  if (error) {
    // Table might not exist yet
    if (error.code === "42P01") {
      return { data: [], error: "Run scripts/create-saved-calculators.sql in Supabase SQL editor" }
    }
    return { data: [], error: error.message }
  }

  return { data: data ?? [] }
}

export async function saveCalculator(
  name: string,
  settings: PricingSettings
): Promise<{ data?: SavedCalculator; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: "Not authenticated" }

  if (!name.trim()) return { error: "Name is required" }

  // Upsert: update if exists, insert if not
  const { data, error } = await supabase
    .from("saved_calculators")
    .upsert(
      {
        user_id: user.id,
        name: name.trim(),
        settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,name" }
    )
    .select()
    .single()

  if (error) {
    if (error.code === "42P01") {
      return { error: "Run scripts/create-saved-calculators.sql in Supabase SQL editor" }
    }
    return { error: error.message }
  }

  return { data }
}

export async function renameCalculator(id: string, newName: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: "Not authenticated" }
  if (!newName.trim()) return { error: "Name is required" }

  const { error } = await supabase
    .from("saved_calculators")
    .update({ name: newName.trim(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  return {}
}

export async function deleteCalculator(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("saved_calculators")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  return {}
}
