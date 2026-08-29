import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase env vars")
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * POST /api/day-pass/activate
 * Called by the client after the Stripe Day Pass checkout success redirect.
 * Verifies the session belongs to the authenticated user and sets day_pass_expires_at.
 * This is a direct fallback in case the webhook hasn't fired yet.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Get the authenticated user from the session cookie
    const supabaseUser = await createServerClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      console.error("[day-pass/activate] not authenticated:", authError?.message)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { session_id } = await req.json().catch(() => ({}))
    console.log("[day-pass/activate] userId:", user.id, "session_id:", session_id)

    // 2. If a Stripe session_id was provided, verify it belongs to this user
    if (session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      console.log("[day-pass/activate] stripe session metadata:", JSON.stringify(session.metadata))

      const metaUserId = session.metadata?.user_id
      const productType = session.metadata?.product_type

      if (productType !== "day_pass") {
        return NextResponse.json({ error: "Session is not a Day Pass" }, { status: 400 })
      }
      if (metaUserId && metaUserId !== user.id) {
        console.error("[day-pass/activate] userId mismatch — meta:", metaUserId, "auth:", user.id)
        return NextResponse.json({ error: "Session does not belong to this user" }, { status: 403 })
      }
      if (session.payment_status !== "paid") {
        return NextResponse.json({ error: "Payment not completed" }, { status: 402 })
      }
    }

    // 3. Write day_pass_expires_at using the service role (bypasses RLS)
    const admin = createAdminClient()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        status: "free",
        day_pass_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    ).select("user_id, day_pass_expires_at").single()

    if (error) {
      console.error("[day-pass/activate] upsert FAILED — code:", (error as any).code, "msg:", error.message)
      if (error.message.includes("day_pass_expires_at") || (error as any).code === "42703") {
        return NextResponse.json(
          { error: "DB migration required: run scripts/add-day-pass.sql in your Supabase SQL editor." },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[day-pass/activate] SUCCESS — userId:", user.id, "expires:", expiresAt, "row:", JSON.stringify(data))
    return NextResponse.json({ success: true, day_pass_expires_at: expiresAt })
  } catch (err) {
    console.error("[day-pass/activate] unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
