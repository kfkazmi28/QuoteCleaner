"use server"

import { createClient } from "@/lib/supabase/server"
import {
  MESSAGE_DEFINITIONS,
  type CommunicationAutomation,
  type CommunicationEvent,
  type CommunicationSettings,
  type CommunicationTemplate,
  type Timing,
} from "@/lib/communications"

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return { supabase, user }
}

/**
 * Ensures the user has the default templates + automations.
 * Safe to call repeatedly; only inserts missing rows.
 */
export async function ensureCommunicationDefaults() {
  const { supabase, user } = await requireUser()

  const { data: existingTemplates } = await supabase
    .from("communication_templates")
    .select("id, key, channel")
    .eq("user_id", user.id)

  const have = new Set((existingTemplates ?? []).map((t) => `${t.key}:${t.channel}`))
  const templateInserts = MESSAGE_DEFINITIONS.flatMap((d) => {
    const rows = []
    if (!have.has(`${d.key}:email`)) {
      rows.push({ user_id: user.id, key: d.key, name: d.name, channel: "email", subject: d.email.subject, body: d.email.body, is_default: true })
    }
    if (!have.has(`${d.key}:sms`)) {
      rows.push({ user_id: user.id, key: d.key, name: d.name, channel: "sms", subject: null, body: d.sms.body, is_default: true })
    }
    return rows
  })
  if (templateInserts.length) {
    await supabase.from("communication_templates").insert(templateInserts)
  }

  const { data: allTemplates } = await supabase
    .from("communication_templates")
    .select("id, key, channel")
    .eq("user_id", user.id)

  const byKey = new Map<string, string>()
  for (const t of allTemplates ?? []) byKey.set(`${t.key}:${t.channel}`, t.id)

  const { data: existingAutomations } = await supabase
    .from("communication_automations")
    .select("key")
    .eq("user_id", user.id)
  const haveAuto = new Set((existingAutomations ?? []).map((a) => a.key))

  const automationInserts = MESSAGE_DEFINITIONS.filter((d) => !haveAuto.has(d.key)).map((d) => ({
    user_id: user.id,
    key: d.key,
    name: d.name,
    description: d.description,
    enabled: false,
    email_enabled: true,
    sms_enabled: false,
    email_template_id: byKey.get(`${d.key}:email`) ?? null,
    sms_template_id: byKey.get(`${d.key}:sms`) ?? null,
    timing: d.defaultTiming,
  }))
  if (automationInserts.length) {
    await supabase.from("communication_automations").insert(automationInserts)
  }

  const { data: settings } = await supabase
    .from("communication_settings")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!settings) {
    await supabase.from("communication_settings").insert({ user_id: user.id })
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<{ data: CommunicationTemplate[]; error: string | null }> {
  try {
    await ensureCommunicationDefaults()
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from("communication_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
    if (error) return { data: [], error: error.message }
    return { data: (data ?? []) as CommunicationTemplate[], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : "Failed to load templates" }
  }
}

export async function updateTemplate(
  id: string,
  input: { subject?: string | null; body: string },
): Promise<{ error: string | null }> {
  try {
    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("communication_templates")
      .update({ subject: input.subject ?? null, body: input.body, is_default: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update template" }
  }
}

export async function resetTemplateToDefault(id: string): Promise<{ error: string | null }> {
  try {
    const { supabase, user } = await requireUser()
    const { data: t } = await supabase
      .from("communication_templates")
      .select("key, channel")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
    if (!t) return { error: "Template not found" }
    const def = MESSAGE_DEFINITIONS.find((d) => d.key === t.key)
    if (!def) return { error: "No default available" }
    const patch = t.channel === "email"
      ? { subject: def.email.subject, body: def.email.body }
      : { subject: null, body: def.sms.body }
    const { error } = await supabase
      .from("communication_templates")
      .update({ ...patch, is_default: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to reset template" }
  }
}

// ── Automations ──────────────────────────────────────────────────────────────

export async function getAutomations(): Promise<{ data: CommunicationAutomation[]; error: string | null }> {
  try {
    await ensureCommunicationDefaults()
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from("communication_automations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
    if (error) return { data: [], error: error.message }
    return { data: (data ?? []) as CommunicationAutomation[], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : "Failed to load automations" }
  }
}

export async function updateAutomation(
  id: string,
  input: Partial<{
    enabled: boolean
    email_enabled: boolean
    sms_enabled: boolean
    email_template_id: string | null
    sms_template_id: string | null
    timing: Timing
  }>,
): Promise<{ error: string | null }> {
  try {
    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("communication_automations")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update automation" }
  }
}

// ── History ──────────────────────────────────────────────────────────────────

export async function getCommunicationEvents(
  limit = 200,
): Promise<{ data: CommunicationEvent[]; error: string | null }> {
  try {
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from("communication_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) return { data: [], error: error.message }
    return { data: (data ?? []) as CommunicationEvent[], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : "Failed to load history" }
  }
}

/**
 * Records a communication event. Delivery is not performed here; a provider
 * integration will later pick up queued/scheduled rows and update status.
 */
export async function logCommunicationEvent(
  input: Omit<CommunicationEvent, "id" | "user_id" | "created_at">,
): Promise<{ error: string | null }> {
  try {
    const { supabase, user } = await requireUser()
    const { error } = await supabase.from("communication_events").insert({ ...input, user_id: user.id })
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to log event" }
  }
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getCommunicationSettings(): Promise<{ data: CommunicationSettings | null; error: string | null }> {
  try {
    await ensureCommunicationDefaults()
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from("communication_settings")
      .select("*")
      .eq("user_id", user.id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as CommunicationSettings, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to load settings" }
  }
}

export async function updateCommunicationSettings(
  input: Partial<Omit<CommunicationSettings, "user_id">>,
): Promise<{ error: string | null }> {
  try {
    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("communication_settings")
      .upsert({ ...input, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save settings" }
  }
}
