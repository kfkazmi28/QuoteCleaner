"use server"

import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export interface StripeConnectStatus {
  connected: boolean
  onboardingComplete: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  accountId: string | null
}

// Fetch the user's current Connect status from DB (fast, no Stripe API call)
export async function getStripeConnectStatus(): Promise<StripeConnectStatus> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { connected: false, onboardingComplete: false, chargesEnabled: false, payoutsEnabled: false, accountId: null }
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_connect_charges_enabled, stripe_connect_payouts_enabled")
    .eq("user_id", user.id)
    .maybeSingle()

  return {
    connected: !!data?.stripe_connect_account_id,
    onboardingComplete: data?.stripe_connect_onboarding_complete ?? false,
    chargesEnabled: data?.stripe_connect_charges_enabled ?? false,
    payoutsEnabled: data?.stripe_connect_payouts_enabled ?? false,
    accountId: data?.stripe_connect_account_id ?? null,
  }
}

// Create a Stripe Express account + return the onboarding link
export async function createStripeConnectAccount(): Promise<{ url?: string; error?: string }> {
  const headersList = await headers()
  const origin = headersList.get("origin") ?? "http://localhost:3000"

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  try {
    // Check if account already exists
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("stripe_connect_account_id")
      .eq("user_id", user.id)
      .maybeSingle()

    let accountId = existing?.stripe_connect_account_id as string | null

    // Create a new Express account if one doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({ type: "express" })
      accountId = account.id

      // Persist the account ID (upsert to handle missing row)
      await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          stripe_connect_account_id: accountId,
          stripe_connect_onboarding_complete: false,
          stripe_connect_charges_enabled: false,
          stripe_connect_payouts_enabled: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
    }

    // Generate an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/account?stripe_connect=refresh`,
      return_url: `${origin}/account?stripe_connect=success`,
      type: "account_onboarding",
    })

    return { url: accountLink.url }
  } catch (err: any) {
    return { error: err?.message ?? "Failed to create Stripe Connect account" }
  }
}

// Refresh Connect account status from Stripe (called after onboarding return)
export async function refreshStripeConnectStatus(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data } = await supabase
    .from("subscriptions")
    .select("stripe_connect_account_id")
    .eq("user_id", user.id)
    .maybeSingle()

  const accountId = data?.stripe_connect_account_id
  if (!accountId) return { error: "No connected account found" }

  try {
    const account = await stripe.accounts.retrieve(accountId)

    await supabase
      .from("subscriptions")
      .update({
        stripe_connect_onboarding_complete: account.details_submitted,
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    return {}
  } catch (err: any) {
    return { error: err?.message ?? "Failed to refresh Stripe Connect status" }
  }
}
