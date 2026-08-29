import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

// Webhook handler must use the service role key — it runs without a user session
// and needs to bypass RLS to write to public.subscriptions
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  console.log("[stripe webhook] Supabase URL present:", !!url)
  console.log("[stripe webhook] service role key present:", !!key)
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    )
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
  } catch (err) {
    console.error("[stripe webhook] failed to create admin client:", err)
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    switch (event.type) {
      // Primary activation path: checkout completed means payment succeeded
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const productType = session.metadata?.product_type
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        console.log("[stripe webhook] checkout.session.completed — userId:", userId, "productType:", productType, "customerId:", customerId)

        if (!userId) {
          console.error("[stripe webhook] checkout.session.completed missing metadata.user_id")
          return NextResponse.json({ error: "Missing user_id in session metadata" }, { status: 400 })
        }

        // Invoice payment — mark invoice as paid
        if (productType === "invoice_payment") {
          const invoiceId = session.metadata?.invoice_id
          if (!invoiceId) {
            console.error("[stripe webhook] invoice_payment missing metadata.invoice_id")
            break
          }
          const { error: invErr } = await supabase
            .from("invoices")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string ?? null,
              stripe_checkout_session_id: session.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoiceId)

          if (invErr) {
            console.error("[stripe webhook] invoice paid update failed:", invErr.message)
            return NextResponse.json({ error: "Invoice update failed" }, { status: 500 })
          }
          console.log("[stripe webhook] invoice paid — invoiceId:", invoiceId)
          break
        }

        // Day Pass: one-time payment — set day_pass_expires_at to now + 24h
        if (productType === "day_pass") {
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          console.log("[stripe webhook] day_pass — writing expiresAt:", expiresAt, "for userId:", userId)

          // First ensure the user has a subscriptions row (insert if missing)
          const { error: ensureError } = await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId || null,
              status: "free",
              day_pass_expires_at: expiresAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )

          if (ensureError) {
            console.error("[stripe webhook] day_pass upsert FAILED — code:", (ensureError as any).code, "msg:", ensureError.message)
            // If the column doesn't exist, the migration hasn't been run — log clearly
            if (ensureError.message.includes("day_pass_expires_at") || (ensureError as any).code === "42703") {
              console.error("[stripe webhook] MIGRATION MISSING: run scripts/add-day-pass.sql in Supabase SQL editor")
            }
            return NextResponse.json({ error: "Database write failed", detail: ensureError.message }, { status: 500 })
          }

          // Double-check by reading back the row
          const { data: verify, error: verifyErr } = await supabase
            .from("subscriptions")
            .select("user_id, day_pass_expires_at")
            .eq("user_id", userId)
            .single()
          console.log("[stripe webhook] day_pass verify read — data:", JSON.stringify(verify), "err:", verifyErr?.message)

          console.log("[stripe webhook] day_pass activated — userId:", userId, "expires:", expiresAt)
          break
        }

        // Regular subscription checkout
        let priceId: string | null = null
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            priceId = subscription.items.data[0]?.price.id ?? null
            console.log("[stripe webhook] retrieved priceId:", priceId)
          } catch (e) {
            console.error("[stripe webhook] could not retrieve subscription:", e)
          }
        }

        const { data: upsertData, error: upsertError } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId ?? null,
            stripe_price_id: priceId,
            status: "active",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        ).select()

        if (upsertError) {
          console.error("[stripe webhook] upsert FAILED (checkout):", JSON.stringify(upsertError))
          return NextResponse.json({ error: "Database write failed", detail: upsertError.message }, { status: 500 })
        }

        console.log("[stripe webhook] upsert SUCCESS (checkout):", JSON.stringify(upsertData))
        break
      }

      // invoice.paid fires on every successful payment (initial + renewals)
      // Use upsert so it can activate even if checkout.session.completed arrived first
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        console.log("[stripe webhook] invoice.paid — customerId:", customerId)

        // Try to find existing row by customer to get user_id for upsert
        const { data: existing, error: lookupError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (lookupError) console.log("[stripe webhook] invoice.paid lookup (no existing row):", lookupError.message)

        if (existing?.user_id) {
          console.log("[stripe webhook] invoice.paid — found existing user_id:", existing.user_id)
          const { data: upsertData, error: upsertError } = await supabase.from("subscriptions").upsert(
            {
              user_id: existing.user_id,
              stripe_customer_id: customerId,
              status: "active",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          ).select()

          if (upsertError) {
            console.error("[stripe webhook] upsert FAILED (invoice.paid):", JSON.stringify(upsertError))
            return NextResponse.json({ error: "Database write failed", detail: upsertError.message }, { status: 500 })
          }
          console.log("[stripe webhook] upsert SUCCESS (invoice.paid):", JSON.stringify(upsertData))
        } else {
          // Row doesn't exist yet — update by customer_id if it races ahead
          console.log("[stripe webhook] invoice.paid — no existing row, attempting update by customer_id")
          await supabase
            .from("subscriptions")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", customerId)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            stripe_price_id: subscription.items.data[0]?.price.id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId)
        break
      }

      // Keep invoice.payment_succeeded as an alias for older Stripe API versions
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from("subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
