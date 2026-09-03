"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  calculateQuote,
  buildTierCards,
  normalizeSettings,
  toSquareFeet,
  TIER_LABELS,
  type PricingSettings,
  type TierCard,
  type TierKey,
} from "@/lib/pricing"
import {
  slugify,
  type BookingForm,
  type PublicBookingForm,
  type BookingHomeDetails,
  type BookingSubmission,
} from "@/lib/booking-forms"

/* ------------------------------------------------------------------ */
/* Owner-side (authenticated, RLS-scoped)                              */
/* ------------------------------------------------------------------ */

export async function getBookingForms(): Promise<{ data: BookingForm[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }

  const { data, error } = await supabase
    .from("booking_forms")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map((r) => ({ ...r, settings_snapshot: normalizeSettings(r.settings_snapshot) })) as BookingForm[] }
}

export interface BookingFormInput {
  name: string
  title: string
  intro?: string | null
  business_name?: string | null
  settings_snapshot: PricingSettings
  source_calculator_id?: string | null
  slug?: string
}

async function uniqueSlug(base: string, excludeId?: string) {
  const admin = createAdminClient()
  let slug = slugify(base) || "booking"
  let candidate = slug
  for (let i = 0; i < 20; i++) {
    let q = admin.from("booking_forms").select("id").eq("slug", candidate)
    if (excludeId) q = q.neq("id", excludeId)
    const { data } = await q.maybeSingle()
    if (!data) return candidate
    candidate = `${slug}-${Math.random().toString(36).slice(2, 6)}`
  }
  return `${slug}-${Date.now().toString(36)}`
}

export async function createBookingForm(input: BookingFormInput): Promise<{ data?: BookingForm; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }
  if (!input.name.trim()) return { error: "Form name is required" }

  const slug = await uniqueSlug(input.slug?.trim() || input.name)

  const { data, error } = await supabase
    .from("booking_forms")
    .insert({
      user_id: user.id,
      slug,
      name: input.name.trim(),
      title: input.title.trim() || "Get an instant cleaning quote",
      intro: input.intro?.trim() || null,
      business_name: input.business_name?.trim() || null,
      settings_snapshot: normalizeSettings(input.settings_snapshot),
      source_calculator_id: input.source_calculator_id ?? null,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: data as BookingForm }
}

export async function updateBookingForm(
  id: string,
  input: Partial<BookingFormInput> & { is_active?: boolean },
): Promise<{ data?: BookingForm; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.title !== undefined) patch.title = input.title.trim() || "Get an instant cleaning quote"
  if (input.intro !== undefined) patch.intro = input.intro?.trim() || null
  if (input.business_name !== undefined) patch.business_name = input.business_name?.trim() || null
  if (input.settings_snapshot !== undefined) patch.settings_snapshot = normalizeSettings(input.settings_snapshot)
  if (input.source_calculator_id !== undefined) patch.source_calculator_id = input.source_calculator_id
  if (input.is_active !== undefined) patch.is_active = input.is_active
  if (input.slug !== undefined && input.slug.trim()) patch.slug = await uniqueSlug(input.slug, id)

  const { data, error } = await supabase
    .from("booking_forms")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: data as BookingForm }
}

export async function deleteBookingForm(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase.from("booking_forms").delete().eq("id", id).eq("user_id", user.id)
  return error ? { error: error.message } : {}
}

/* ------------------------------------------------------------------ */
/* Public side (anonymous visitors; uses service role, never leaks     */
/* pricing settings to the browser)                                    */
/* ------------------------------------------------------------------ */

async function loadFormBySlug(slug: string) {
  const admin = createAdminClient()
  const { data } = await admin.from("booking_forms").select("*").eq("slug", slug).maybeSingle()
  return data as BookingForm | null
}

export async function getPublicBookingForm(slug: string): Promise<PublicBookingForm | null> {
  const form = await loadFormBySlug(slug)
  if (!form) return null
  return {
    id: form.id,
    slug: form.slug,
    title: form.title,
    intro: form.intro,
    business_name: form.business_name,
    is_active: form.is_active,
  }
}

function parseHome(home: BookingHomeDetails) {
  const sqRaw = parseFloat(home.squareFootage)
  const beds = parseFloat(home.bedrooms)
  const baths = parseFloat(home.bathrooms)
  if (!Number.isFinite(sqRaw) || sqRaw <= 0) return { error: "Please enter the home size." }
  if (!Number.isFinite(beds) || beds < 0) return { error: "Please enter the number of bedrooms." }
  if (!Number.isFinite(baths) || baths < 0) return { error: "Please enter the number of bathrooms." }
  const sq = Math.min(sqRaw, 100000)
  return {
    input: {
      squareFootage: toSquareFeet(sq, home.sqftUnit === "sqm" ? "sqm" : "sqft"),
      cleanLevel: ["1", "2", "3"].includes(home.cleanLevel) ? home.cleanLevel : "2",
      bedrooms: Math.min(beds, 50),
      bathrooms: Math.min(baths, 50),
      pets: Math.max(0, Math.min(parseFloat(home.pets) || 0, 20)),
      children: Math.max(0, Math.min(parseFloat(home.children) || 0, 20)),
    },
    sqft: toSquareFeet(sq, home.sqftUnit === "sqm" ? "sqm" : "sqft"),
  }
}

/** Server-side pricing so the settings snapshot never reaches the client. */
export async function getPublicBookingPrices(
  slug: string,
  home: BookingHomeDetails,
): Promise<{ cards?: TierCard[]; totalHours?: number; error?: string }> {
  const form = await loadFormBySlug(slug)
  if (!form || !form.is_active) return { error: "This booking form is not available." }

  const parsed = parseHome(home)
  if ("error" in parsed) return { error: parsed.error }

  const results = calculateQuote(parsed.input, normalizeSettings(form.settings_snapshot))
  return { cards: buildTierCards(results), totalHours: results.totalHours }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitBookingRequest(
  sub: BookingSubmission,
): Promise<{ ok?: true; quoteId?: string; error?: string }> {
  const form = await loadFormBySlug(sub.slug)
  if (!form || !form.is_active) return { error: "This booking form is not available." }

  const c = sub.client
  if (!c.name?.trim()) return { error: "Please enter your name." }
  if (!EMAIL_RE.test(c.email ?? "")) return { error: "Please enter a valid email address." }
  if (!c.phone?.trim()) return { error: "Please enter your phone number." }
  if (!c.address?.trim()) return { error: "Please enter the service address." }
  if (!c.preferredDate) return { error: "Please choose a preferred date." }
  if (!(sub.tier in TIER_LABELS)) return { error: "Please choose a service." }

  const parsed = parseHome(sub.home)
  if ("error" in parsed) return { error: parsed.error }

  const settings = normalizeSettings(form.settings_snapshot)
  const results = calculateQuote(parsed.input, settings)
  const cards = buildTierCards(results)
  const chosen = cards.find((card) => card.key === sub.tier)!

  const admin = createAdminClient()

  // 1) Save as a requested quote in the owner's pipeline
  const { data: quote, error: quoteErr } = await admin
    .from("saved_quotes")
    .insert({
      user_id: form.user_id,
      quote_name: `${c.name.trim()} – ${TIER_LABELS[sub.tier]}`,
      home_address: c.address.trim(),
      notes: c.notes?.trim() || null,
      client_name: c.name.trim(),
      client_email: c.email.trim(),
      client_phone: c.phone.trim(),
      quote_generated_by: form.business_name || "Booking form",
      square_footage: String(Math.round(parsed.sqft)),
      clean_level: parsed.input.cleanLevel,
      bedrooms: String(parsed.input.bedrooms),
      bathrooms: String(parsed.input.bathrooms),
      pets: String(parsed.input.pets),
      children: String(parsed.input.children),
      hourly_rate: settings.hourlyRate,
      result_move_in: results.moveInMoveOut,
      result_deep_clean: results.deepClean,
      result_standard: results.standardSingle,
      result_monthly: results.monthly,
      result_biweekly: results.biweekly,
      result_weekly: results.weekly,
      settings_snapshot: settings,
      preferred_package: sub.tier,
      status: "requested",
      booking_form_id: form.id,
      preferred_date: c.preferredDate,
      preferred_time_window: c.timeWindow,
    })
    .select("id")
    .single()

  if (quoteErr) return { error: "We couldn't save your request. Please try again." }

  // 2) Upsert contact (fill missing fields only)
  const { data: existing } = await admin
    .from("client_contacts")
    .select("id, phone, email, address")
    .eq("user_id", form.user_id)
    .ilike("name", c.name.trim())
    .maybeSingle()

  if (existing) {
    const updates: Record<string, string> = {}
    if (!existing.phone) updates.phone = c.phone.trim()
    if (!existing.email) updates.email = c.email.trim()
    if (!existing.address) updates.address = c.address.trim()
    if (Object.keys(updates).length) await admin.from("client_contacts").update(updates).eq("id", existing.id)
  } else {
    await admin.from("client_contacts").insert({
      user_id: form.user_id,
      name: c.name.trim(),
      email: c.email.trim(),
      phone: c.phone.trim(),
      address: c.address.trim(),
    })
  }

  // 3) Bump submissions counter
  await admin.from("booking_forms").update({ submissions_count: (form.submissions_count ?? 0) + 1 }).eq("id", form.id)

  // Email delivery is intentionally deferred until a provider is connected.
  // The request is fully persisted above and can be delivered later from the
  // communication_events pipeline without changing the client flow.
  return { ok: true, quoteId: quote.id }
}
