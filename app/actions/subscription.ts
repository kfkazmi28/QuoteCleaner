"use server"

import { createClient } from "@/lib/supabase/server"

export async function getSubscriptionAndDayPassStatus(): Promise<{
  isSubscribed: boolean
  status: string | null
  dayPassExpiresAt: string | null
  isDayPassActive: boolean
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { isSubscribed: false, status: null, dayPassExpiresAt: null, isDayPassActive: false }

  const { data } = await supabase
    .from("subscriptions")
    .select("status, day_pass_expires_at")
    .eq("user_id", user.id)
    .single()

  const isSubscribed = data?.status === "active" || data?.status === "trialing"
  const dayPassExpiresAt = data?.day_pass_expires_at ?? null
  const isDayPassActive = !!dayPassExpiresAt && new Date(dayPassExpiresAt) > new Date()

  return { isSubscribed, status: data?.status ?? null, dayPassExpiresAt, isDayPassActive }
}

export async function getSubscriptionStatus(): Promise<{
  isSubscribed: boolean
  status: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { isSubscribed: false, status: null }

  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single()

  const isSubscribed = data?.status === "active" || data?.status === "trialing"
  return { isSubscribed, status: data?.status ?? null }
}

export async function cancelSubscription(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)

  if (error) return { error: "Failed to cancel subscription. Please contact support." }

  return {}
}
