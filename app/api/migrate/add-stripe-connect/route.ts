import { NextResponse } from "next/server"

// Run this SQL in your Supabase SQL editor to add Stripe Connect fields:
const SQL = `
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT false;
`

export async function GET() {
  return NextResponse.json({
    message: "Run the following SQL in your Supabase SQL editor to add Stripe Connect fields",
    sql: SQL,
  })
}
