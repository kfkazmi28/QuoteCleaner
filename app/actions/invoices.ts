"use server"

import { createClient } from "@/lib/supabase/server"

export interface Invoice {
  id: string
  user_id: string
  quote_id: string | null
  calendar_event_id: string | null
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  home_address: string | null
  invoice_title: string
  amount_total: number
  amount_due: number
  due_date: string | null
  notes: string | null
  status: "draft" | "sent" | "paid" | "canceled"
  stripe_payment_link: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateInvoiceInput {
  quote_id?: string
  client_name?: string
  client_email?: string
  client_phone?: string
  home_address?: string
  invoice_title: string
  amount_total: number
  amount_due: number
  due_date?: string
  notes?: string
}

export async function createInvoice(input: CreateInvoiceInput): Promise<{ data?: Invoice; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Not authenticated" }

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      ...input,
      status: "draft",
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: data as Invoice }
}

export async function getInvoices(): Promise<Invoice[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (data ?? []) as Invoice[]
}

export async function getInvoicesByStatus(status: Invoice["status"]): Promise<Invoice[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", status)
    .order("created_at", { ascending: false })

  return (data ?? []) as Invoice[]
}

export async function getInvoiceByQuoteId(quoteId: string): Promise<Invoice | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user.id)
    .eq("quote_id", quoteId)
    .not("status", "eq", "canceled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data as Invoice | null
}

// Auto-create or update a draft invoice tied to a quote/event.
// Uses quote_id as the deduplication key (always present). Safe to call multiple times.
export async function upsertInvoiceForEvent(params: {
  calendarEventId?: string | null
  quoteId?: string | null
  invoiceTitle: string
  clientName?: string | null
  clientEmail?: string | null
  clientPhone?: string | null
  homeAddress?: string | null
  amountTotal: number
  amountDue: number
}): Promise<{ data?: Invoice; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Not authenticated" }

  // Look up an existing non-canceled invoice by quote_id (most reliable key)
  let existing: Invoice | null = null
  if (params.quoteId) {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .eq("quote_id", params.quoteId)
      .not("status", "eq", "canceled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    existing = data as Invoice | null
  }

  if (existing) {
    // Only update draft invoices — don't overwrite sent/paid ones
    if (existing.status === "draft") {
      const { data, error } = await supabase
        .from("invoices")
        .update({
          invoice_title: params.invoiceTitle,
          client_name: params.clientName ?? null,
          client_email: params.clientEmail ?? null,
          client_phone: params.clientPhone ?? null,
          home_address: params.homeAddress ?? null,
          amount_total: params.amountTotal,
          amount_due: params.amountDue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()
      if (error) return { error: error.message }
      return { data: data as Invoice }
    }
    // Already sent/paid — return as-is
    return { data: existing as Invoice }
  }

  // Build the insert payload — only include calendar_event_id if column may exist
  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    quote_id: params.quoteId ?? null,
    invoice_title: params.invoiceTitle,
    client_name: params.clientName ?? null,
    client_email: params.clientEmail ?? null,
    client_phone: params.clientPhone ?? null,
    home_address: params.homeAddress ?? null,
    amount_total: params.amountTotal,
    amount_due: params.amountDue,
    status: "draft",
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert(insertPayload)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: data as Invoice }
}

// Bulk fetch invoice status keyed by quote_id for a set of calendar events.
// Pass a map of eventId -> quoteId so we can look up by quote_id (which always exists).
export async function getInvoicesByQuoteIds(
  quoteIds: string[]
): Promise<Record<string, Invoice>> {
  if (!quoteIds.length) return {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user.id)
    .in("quote_id", quoteIds)
    .not("status", "eq", "canceled")
    .order("created_at", { ascending: false })

  // Keyed by quote_id — first row wins (most recent non-canceled)
  const map: Record<string, Invoice> = {}
  for (const inv of (data ?? []) as Invoice[]) {
    if (inv.quote_id && !map[inv.quote_id]) map[inv.quote_id] = inv
  }
  return map
}

export async function updateInvoice(
  invoiceId: string,
  updates: Partial<Pick<Invoice, "status" | "stripe_payment_link" | "stripe_checkout_session_id" | "stripe_payment_intent_id" | "paid_at" | "notes" | "due_date" | "amount_due">>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("invoices")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  return {}
}

export async function markInvoiceSent(invoiceId: string): Promise<{ error?: string }> {
  return updateInvoice(invoiceId, { status: "sent" })
}

export async function deleteInvoice(invoiceId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  return {}
}

export async function checkInvoicesTableExists(): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("invoices").select("id").limit(1)
  return !error
}
