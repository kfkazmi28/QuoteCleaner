"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Resend } from "resend"
import { EMAIL_SENDER, COMPANY_NAME, WEBSITE_URL, wrapEmailHtml } from "@/lib/company-config"
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
  timeWindowLabel,
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

  // 4) Emails (best-effort; never block the client on failures)
  try {
    await sendBookingEmails({ form, quoteId: quote.id, client: c, chosen, sqft: parsed.sqft, home: parsed.input })
  } catch (e) {
    console.error("[booking] email failed", e)
  }

  return { ok: true, quoteId: quote.id }
}

/* ------------------------------------------------------------------ */
/* Email helpers                                                       */
/* ------------------------------------------------------------------ */

function esc(s: string) {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!)
}

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

async function sendBookingEmails(args: {
  form: BookingForm
  quoteId: string
  client: BookingSubmission["client"]
  chosen: TierCard
  sqft: number
  home: { cleanLevel: string; bedrooms: number; bathrooms: number; pets: number; children: number }
}) {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const admin = createAdminClient()
  const { form, client, chosen } = args

  // Owner email + sender preferences
  const [{ data: ownerRes }, { data: comm }] = await Promise.all([
    admin.auth.admin.getUserById(form.user_id),
    admin.from("communication_settings").select("email_sender_name, email_reply_to").eq("user_id", form.user_id).maybeSingle(),
  ])
  const ownerEmail = ownerRes?.user?.email
  const business = form.business_name || comm?.email_sender_name || COMPANY_NAME
  const replyTo = comm?.email_reply_to || ownerEmail || undefined

  const dateLabel = fmtDate(client.preferredDate)
  const windowLabel = timeWindowLabel(client.timeWindow)
  const price = `$${chosen.price.toLocaleString()}`

  const detailRows = [
    ["Service", `${chosen.label} — ${price}${chosen.recurring ? " per visit" : ""}`],
    ["Preferred date", `${dateLabel} (${windowLabel})`],
    ["Address", client.address],
    ["Home", `${Math.round(args.sqft).toLocaleString()} sq ft · ${args.home.bedrooms} bed · ${args.home.bathrooms} bath`],
    ["Pets / Children", `${args.home.pets} / ${args.home.children}`],
    ...(client.notes ? [["Notes", client.notes]] : []),
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;color:#111827;font-size:14px;">${esc(v)}</td></tr>`,
    )
    .join("")

  const sends: Promise<unknown>[] = []

  // Owner notification
  if (ownerEmail) {
    const link = `${WEBSITE_URL}/dashboard/quotes`
    sends.push(
      resend.emails.send({
        from: EMAIL_SENDER,
        to: ownerEmail,
        replyTo: client.email,
        subject: `New booking request from ${client.name} — ${chosen.label}`,
        html: wrapEmailHtml(`
          <h2 style="margin:0 0 6px;font-size:20px;color:#18181b;">New booking request</h2>
          <p style="margin:0 0 18px;font-size:14px;color:#6b7280;">Submitted via your "${esc(form.name)}" booking form.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:18px;">
            <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;">Client</td><td style="padding:6px 0;color:#111827;font-size:14px;">${esc(client.name)}<br><a href="mailto:${esc(client.email)}" style="color:#0d9488;">${esc(client.email)}</a><br>${esc(client.phone)}</td></tr>
            ${detailRows}
          </table>
          <a href="${link}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px;font-size:14px;">Open in Saved Quotes</a>
        `),
      }),
    )
  }

  // Client confirmation
  sends.push(
    resend.emails.send({
      from: EMAIL_SENDER,
      to: client.email,
      replyTo,
      subject: `${business}: we received your cleaning request`,
      html: wrapEmailHtml(`
        <h2 style="margin:0 0 6px;font-size:20px;color:#18181b;">Thanks, ${esc(client.name.split(" ")[0])}!</h2>
        <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.5;">We received your request and will reach out shortly to confirm your appointment.</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:18px;">${detailRows}</table>
        <p style="margin:0;font-size:13px;color:#6b7280;">Pricing shown is an estimate based on the details you provided and may be adjusted after a walkthrough.</p>
        <p style="margin:18px 0 0;font-size:14px;color:#374151;">— ${esc(business)}</p>
      `),
    }),
  )

  const results = await Promise.allSettled(sends)

  // Log to communications history
  const events = [
    ownerEmail && {
      user_id: form.user_id,
      customer_name: client.name,
      customer_email: ownerEmail,
      channel: "email",
      message_type: "booking_request_owner",
      status: results[0]?.status === "fulfilled" ? "sent" : "failed",
      subject: `New booking request from ${client.name}`,
      sent_at: new Date().toISOString(),
      provider: "resend",
      error_message: results[0]?.status === "rejected" ? String((results[0] as PromiseRejectedResult).reason) : null,
    },
    {
      user_id: form.user_id,
      customer_name: client.name,
      customer_email: client.email,
      customer_phone: client.phone,
      channel: "email",
      message_type: "booking_request_confirmation",
      status: results[results.length - 1]?.status === "fulfilled" ? "sent" : "failed",
      subject: `${business}: we received your cleaning request`,
      sent_at: new Date().toISOString(),
      provider: "resend",
      error_message:
        results[results.length - 1]?.status === "rejected"
          ? String((results[results.length - 1] as PromiseRejectedResult).reason)
          : null,
    },
  ].filter(Boolean)

  await admin.from("communication_events").insert(events)
}
