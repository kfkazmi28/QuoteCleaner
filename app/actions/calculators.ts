"use server"

import { createClient } from "@/lib/supabase/server"
import type { PricingSettings } from "@/contexts/pricing-settings-context"

export interface SavedCalculator {
  id: string
  name: string
  settings: PricingSettings
  created_at: string
  updated_at: string
  folder_id?: string | null
}

export interface CalculatorFolder {
  id: string
  name: string
  color: string
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
  settings: PricingSettings,
  folderId?: string | null
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
        folder_id: folderId ?? null,
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

export async function getCalculatorFolders(): Promise<{ data: CalculatorFolder[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }
  const { data, error } = await supabase.from("calculator_folders").select("id,name,color,created_at,updated_at").eq("user_id", user.id).order("name")
  return { data: data ?? [], error: error?.message }
}

export async function createCalculatorFolder(name: string, color: string): Promise<{ data?: CalculatorFolder; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }
  if (!name.trim()) return { error: "Folder name is required" }
  const { data, error } = await supabase.from("calculator_folders").insert({ user_id: user.id, name: name.trim(), color }).select("id,name,color,created_at,updated_at").single()
  return { data: data ?? undefined, error: error?.message }
}

export async function updateCalculatorFolder(id: string, updates: { name?: string; color?: string }): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }
  if (updates.name !== undefined && !updates.name.trim()) return { error: "Folder name is required" }
  const { error } = await supabase.from("calculator_folders").update({ ...updates, name: updates.name?.trim(), updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id)
  return { error: error?.message }
}

export async function moveCalculator(id: string, folderId: string | null): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }
  const { error } = await supabase.from("saved_calculators").update({ folder_id: folderId, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id)
  return { error: error?.message }
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
