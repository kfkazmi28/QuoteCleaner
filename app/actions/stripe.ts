"use server"

import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { updateInvoice } from "@/app/actions/invoices"

export async function createCheckoutSession(): Promise<{ url: string }> {
  const headersList = await headers()
  const origin = headersList.get("origin") ?? "http://localhost:3000"

  // Get the authenticated user so we can link the Stripe session back to them
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_MONTHLY_PRICE_ID as string,
        quantity: 1,
      },
    ],
    // Attach user_id so the webhook can upsert into subscriptions table
    metadata: {
      user_id: user?.id ?? "",
    },
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  })

  if (!session.url) {
    throw new Error("Failed to create Stripe checkout session")
  }

  return { url: session.url }
}

export async function createDayPassCheckoutSession(): Promise<{ url: string }> {
  const headersList = await headers()
  const origin = headersList.get("origin") ?? "http://localhost:3000"

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price: process.env.STRIPE_DAY_PASS_PRICE_ID as string,
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user?.id ?? "",
      product_type: "day_pass",
    },
    success_url: `${origin}/dashboard?checkout=day_pass_success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  })

  if (!session.url) {
    throw new Error("Failed to create day pass checkout session")
  }

  return { url: session.url }
}

export async function createInvoiceCheckoutSession(params: {
  invoiceId: string
  quoteId?: string | null
  invoiceTitle: string
  amountDue: number
}): Promise<{ url?: string; error?: string }> {
  const headersList = await headers()
  const origin = headersList.get("origin") ?? "http://localhost:3000"

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Look up the user's Stripe Connect account
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_connect_account_id, stripe_connect_charges_enabled")
    .eq("user_id", user.id)
    .maybeSingle()

  const connectedAccountId = sub?.stripe_connect_account_id as string | null
  const chargesEnabled = sub?.stripe_connect_charges_enabled as boolean | null

  if (!connectedAccountId || !chargesEnabled) {
    return { error: "Stripe account not connected. Please connect your Stripe account in Account settings before sending invoice payment links." }
  }

  try {
    // Create the checkout session on the connected account so payment goes directly to the user's business
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: params.invoiceTitle,
              },
              unit_amount: Math.round(params.amountDue * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          user_id: user.id,
          invoice_id: params.invoiceId,
          quote_id: params.quoteId ?? "",
          product_type: "invoice_payment",
        },
        success_url: `${origin}/invoice/success?invoice_id=${params.invoiceId}`,
        cancel_url: `${origin}/invoice/cancel?invoice_id=${params.invoiceId}`,
        // Optional future platform fee: application_fee_amount: 0
      },
      { stripeAccount: connectedAccountId }  // route payment to the user's connected account
    )

    if (!session.url) return { error: "Failed to create checkout session" }

    await updateInvoice(params.invoiceId, {
      stripe_payment_link: session.url,
      stripe_checkout_session_id: session.id,
    })

    return { url: session.url }
  } catch (err: any) {
    return { error: err?.message ?? "Stripe error" }
  }
}
