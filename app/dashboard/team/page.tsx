"use client"

import { useState, useEffect, useTransition } from "react"
import {
  Users, UserPlus, Mail, Trash2, RefreshCw, Crown, Clock, CheckCircle2, AlertCircle, Copy, Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  getTeamData,
  inviteTeamMember,
  removeTeamMember,
  resendInvite,
  type WorkspaceMember,
} from "@/app/actions/team"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkspaceMember["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3 w-3" /> Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      <Clock className="h-3 w-3" /> Pending
    </span>
  )
}

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/invite?token=${token}`

  const handleCopy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopy}>
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [seatLimit, setSeatLimit] = useState(1)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [inviteTokens, setInviteTokens] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getTeamData().then(({ members, isSubscribed, seatLimit, error }) => {
      if (error) toast.error(error)
      setMembers(members)
      setIsSubscribed(isSubscribed)
      setSeatLimit(seatLimit)
      setLoading(false)
    })
  }, [])

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    startTransition(async () => {
      const { error, token } = await inviteTeamMember(email.trim())
      if (error) {
        toast.error(error)
        return
      }
      toast.success(`Invite sent to ${email.trim()}`)
      setEmail("")
      // Refresh list
      const { members: updated } = await getTeamData()
      setMembers(updated)
      if (token) {
        // Store token keyed by email so we can show copy link
        const invited = updated.find(m => m.email === email.toLowerCase().trim())
        if (invited) setInviteTokens(prev => ({ ...prev, [invited.id]: token }))
      }
    })
  }

  const handleRemove = (memberId: string, memberEmail: string) => {
    startTransition(async () => {
      const { error } = await removeTeamMember(memberId)
      if (error) { toast.error(error); return }
      toast.success(`${memberEmail} removed`)
      setMembers(prev => prev.filter(m => m.id !== memberId))
    })
  }

  const handleResend = (memberId: string, memberEmail: string) => {
    startTransition(async () => {
      const { error, token } = await resendInvite(memberId)
      if (error) { toast.error(error); return }
      toast.success(`Invite resent to ${memberEmail}`)
      if (token) setInviteTokens(prev => ({ ...prev, [memberId]: token }))
    })
  }

  const activeCount = members.filter(m => m.status === "active").length
  const seatsUsed = members.length  // pending + active count toward limit

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Team Members</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Invite teammates to access your workspace and quotes.
        </p>
      </div>

      {/* Pro gate banner */}
      {!isSubscribed && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-amber-800">Pro plan required for team members</p>
            <p className="mt-0.5 text-amber-700">
              Upgrade to Pro to invite up to 2 team members, with additional seats at $5/month each.
            </p>
          </div>
          <Button size="sm" className="shrink-0" asChild>
            <Link href="/pricing">Upgrade</Link>
          </Button>
        </div>
      )}

      {/* Seat usage */}
      {isSubscribed && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{seatsUsed}</span> of{" "}
            <span className="font-semibold text-foreground">{seatLimit}</span> included seats used
          </span>
          {seatsUsed >= seatLimit && (
            <span className="text-xs text-muted-foreground">+$5/month per additional seat</span>
          )}
        </div>
      )}

      {/* Invite form */}
      <form onSubmit={handleInvite} className="mb-8">
        <Label htmlFor="invite-email" className="mb-1.5 block text-sm font-medium">
          Invite by email
        </Label>
        <div className="flex gap-2">
          <Input
            id="invite-email"
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={!isSubscribed || isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={!isSubscribed || isPending || !email.trim()}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            {isPending ? "Inviting..." : "Invite"}
          </Button>
        </div>
        {!isSubscribed && (
          <p className="mt-1.5 text-xs text-muted-foreground">Available on Pro plan.</p>
        )}
      </form>

      {/* Member list */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          {loading ? "Loading..." : `${members.length} member${members.length !== 1 ? "s" : ""}`}
        </h2>

        {!loading && members.length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No team members yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Invite someone above to get started.
            </p>
          </div>
        )}

        {members.map(member => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
          >
            {/* Avatar */}
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              member.role === "owner"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {member.role === "owner"
                ? <Crown className="h-4 w-4" />
                : member.email[0].toUpperCase()
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="truncate text-sm font-medium text-foreground">{member.email}</span>
                <StatusBadge status={member.status} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                {member.role}
                {member.status === "active" && member.accepted_at &&
                  ` · joined ${new Date(member.accepted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                }
                {member.status === "pending" &&
                  ` · invited ${new Date(member.invited_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                }
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {member.status === "pending" && (
                <>
                  {inviteTokens[member.id] && <CopyLinkButton token={inviteTokens[member.id]} />}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={isPending}
                    onClick={() => handleResend(member.id, member.email)}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Resend
                  </Button>
                </>
              )}
              {member.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isPending}
                  onClick={() => handleRemove(member.id, member.email)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Additional seats note */}
      {isSubscribed && seatsUsed >= seatLimit && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Need more seats? Each additional member is $5/month.{" "}
          <Link href="/pricing" className="text-primary underline-offset-2 hover:underline">
            Manage plan
          </Link>
        </p>
      )}
      </div>
    </div>
  )
}
