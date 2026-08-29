import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/migrate/create-invoices
 * Creates the invoices table if it doesn't exist.
 * Returns { ok: true } if already set up, { ok: false, sql } with the DDL to run if not.
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Check if table exists by selecting from it
    const { error } = await supabase.from("invoices").select("id").limit(1)

    if (!error) {
      return NextResponse.json({ ok: true, message: "invoices table already exists" })
    }

    const sql = `
-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.saved_quotes(id) ON DELETE SET NULL,
  calendar_event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  home_address TEXT,
  invoice_title TEXT NOT NULL,
  amount_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','canceled')),
  stripe_payment_link TEXT,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own invoices"
  ON public.invoices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS invoices_quote_id_idx ON public.invoices (quote_id);
CREATE INDEX IF NOT EXISTS invoices_calendar_event_id_idx ON public.invoices (calendar_event_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices (user_id, status);
    `.trim()

    return NextResponse.json({
      ok: false,
      reason: "table_missing",
      sql,
      message: "Run the SQL above in your Supabase SQL editor to enable the Invoices feature.",
    })
  } catch (err) {
    return NextResponse.json({ ok: false, reason: "exception", error: String(err) }, { status: 500 })
  }
}
