"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const FREE_SEAT_LIMIT = 1   // owner only — no extra members
const PRO_SEAT_LIMIT  = 2   // 2 included members (owner + 1)

// ── Types ────────────────────────────────────────────────────────────────────

export type WorkspaceMember = {
  id: string
  workspace_id: string
  user_id: string | null
  email: string
  role: "owner" | "member"
  status: "pending" | "active" | "removed"
  invited_at: string
  accepted_at: string | null
}

export type Workspace = {
  id: string
  owner_id: string
  name: string
  created_at: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateWorkspace(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<Workspace> {
  const { data: existing } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId)
    .single()

  if (existing) return existing as Workspace

  const { data: created, error } = await supabase
    .from("workspaces")
    .insert({ owner_id: userId })
    .select()
    .single()

  if (error || !created) throw new Error("Failed to create workspace")
  return created as Workspace
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function getTeamData(): Promise<{
  workspace: Workspace | null
  members: WorkspaceMember[]
  isSubscribed: boolean
  seatLimit: number
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { workspace: null, members: [], isSubscribed: false, seatLimit: FREE_SEAT_LIMIT, error: "Not authenticated" }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single()

  const isSubscribed = sub?.status === "active" || sub?.status === "trialing"
  const seatLimit = isSubscribed ? PRO_SEAT_LIMIT : FREE_SEAT_LIMIT

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspace.id)
    .neq("status", "removed")
    .order("invited_at", { ascending: true })

  if (error) return { workspace, members: [], isSubscribed, seatLimit, error: error.message }

  return { workspace, members: (members ?? []) as WorkspaceMember[], isSubscribed, seatLimit, error: null }
}

export async function inviteTeamMember(email: string): Promise<{ error: string | null; token?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Check subscription + seat limit
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single()

  const isSubscribed = sub?.status === "active" || sub?.status === "trialing"
  const seatLimit = isSubscribed ? PRO_SEAT_LIMIT : FREE_SEAT_LIMIT

  const workspace = await getOrCreateWorkspace(supabase, user.id)

  const { count } = await supabase
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .neq("status", "removed")

  // seatLimit = extra members allowed (not counting owner)
  if ((count ?? 0) >= seatLimit) {
    return { error: isSubscribed
      ? `You have reached your ${seatLimit} seat limit. Add more seats at $5/month each.`
      : "Team members require a Pro plan. Upgrade to invite teammates."
    }
  }

  // Check for existing active/pending invite
  const { data: existing } = await supabase
    .from("workspace_members")
    .select("id, status")
    .eq("workspace_id", workspace.id)
    .eq("email", email.toLowerCase())
    .neq("status", "removed")
    .maybeSingle()

  if (existing) return { error: "This email has already been invited." }

  // Create member record
  const { data: member, error: memberErr } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspace.id,
      email: email.toLowerCase(),
      role: "member",
      status: "pending",
    })
    .select()
    .single()

  if (memberErr || !member) return { error: memberErr?.message ?? "Failed to create member" }

  // Create invite token
  const { data: invite, error: inviteErr } = await supabase
    .from("team_invites")
    .insert({ workspace_id: workspace.id, member_id: member.id })
    .select("token")
    .single()

  if (inviteErr || !invite) return { error: inviteErr?.message ?? "Failed to create invite" }

  revalidatePath("/dashboard/team")
  return { error: null, token: invite.token }
}

export async function removeTeamMember(memberId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("workspace_members")
    .update({ status: "removed" })
    .eq("id", memberId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/team")
  return { error: null }
}

export async function resendInvite(memberId: string): Promise<{ error: string | null; token?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Delete old invite and issue a new one
  await supabase.from("team_invites").delete().eq("member_id", memberId)

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("id", memberId)
    .single()

  if (!member) return { error: "Member not found" }

  const { data: invite, error } = await supabase
    .from("team_invites")
    .insert({ workspace_id: member.workspace_id, member_id: memberId })
    .select("token")
    .single()

  if (error || !invite) return { error: error?.message ?? "Failed to resend" }
  return { error: null, token: invite.token }
}

export async function acceptTeamInvite(token: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Must be logged in to accept an invite" }

  const { data: invite } = await supabase
    .from("team_invites")
    .select("id, member_id, expires_at, used_at")
    .eq("token", token)
    .single()

  if (!invite) return { error: "Invalid invite link" }
  if (invite.used_at) return { error: "This invite has already been used" }
  if (new Date(invite.expires_at) < new Date()) return { error: "This invite has expired" }

  // Mark member as active and link user_id
  const { error: memberErr } = await supabase
    .from("workspace_members")
    .update({ status: "active", user_id: user.id, accepted_at: new Date().toISOString() })
    .eq("id", invite.member_id)

  if (memberErr) return { error: memberErr.message }

  // Mark invite as used
  await supabase
    .from("team_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id)

  return { error: null }
}
