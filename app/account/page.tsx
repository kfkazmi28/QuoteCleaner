"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardNav } from "@/components/dashboard-nav"
import { User, CreditCard, Users, LifeBuoy, ArrowRight, ExternalLink, AlertTriangle, Send, Pencil, Check, X, Eye, EyeOff, Zap, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getSubscriptionAndDayPassStatus, cancelSubscription } from "@/app/actions/subscription"
import { getStripeConnectStatus, createStripeConnectAccount, refreshStripeConnectStatus, type StripeConnectStatus } from "@/app/actions/stripe-connect"
import { getTeamData } from "@/app/actions/team"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type AccountData = {
  email: string
  name: string
  memberSince: string
  isSubscribed: boolean
  plan: string
  activeMembers: number
  pendingMembers: number
  seatLimit: number
  isDayPassActive: boolean
  dayPassExpiresAt: string | null
}

function DayPassTimeLeft({ expiresAt }: { expiresAt: string }) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return <span>Expired</span>
  const h = Math.floor(diff / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return <span>{h}h {m}m remaining</span>
}

export default function AccountPage() {
  const router = useRouter()
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  // Profile editing
  const [editingName, setEditingName] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [draftEmail, setDraftEmail] = useState("")
  const [draftPassword, setDraftPassword] = useState("")
  const [draftPasswordConfirm, setDraftPasswordConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [showSupportDialog, setShowSupportDialog] = useState(false)
  const [supportTopic, setSupportTopic] = useState("")
  const [supportSubject, setSupportSubject] = useState("")
  const [supportMessage, setSupportMessage] = useState("")
  const [sendingSupport, setSendingSupport] = useState(false)
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)

  async function saveName() {
    if (!draftName.trim()) return
    setSavingProfile(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { full_name: draftName.trim() } })
    setSavingProfile(false)
    if (error) { toast.error("Failed to update name"); return }
    setData(prev => prev ? { ...prev, name: draftName.trim() } : prev)
    setEditingName(false)
    toast.success("Name updated")
  }

  async function savePassword() {
    if (!draftPassword) return
    if (draftPassword.length < 8) { toast.error("Password must be at least 8 characters"); return }
    if (draftPassword !== draftPasswordConfirm) { toast.error("Passwords do not match"); return }
    setSavingProfile(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: draftPassword })
    setSavingProfile(false)
    if (error) { toast.error(error.message); return }
    setEditingPassword(false)
    setDraftPassword("")
    setDraftPasswordConfirm("")
    toast.success("Password updated successfully")
  }

  async function saveEmail() {
    if (!draftEmail.trim()) return
    setSavingProfile(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: draftEmail.trim() })
    setSavingProfile(false)
    if (error) { toast.error(error.message); return }
    setEditingEmail(false)
    toast.success("Confirmation sent — check your new email inbox to verify the change.")
  }

  async function handleConnectStripe() {
    setConnectLoading(true)
    const { url, error } = await createStripeConnectAccount()
    setConnectLoading(false)
    if (error) { toast.error(error); return }
    if (url) window.location.href = url
  }

  async function handleCancel() {
    setCancelling(true)
    const { error } = await cancelSubscription()
    setCancelling(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success("Subscription cancelled. You'll keep Pro access until the end of your billing period.")
    setShowCancelDialog(false)
    setData(prev => prev ? { ...prev, isSubscribed: false, plan: "Free" } : prev)
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login?redirectTo=/account")
        return
      }

      // Handle Stripe Connect return URLs
      const params = new URLSearchParams(window.location.search)
      const stripeConnect = params.get("stripe_connect")
      if (stripeConnect === "success" || stripeConnect === "refresh") {
        await refreshStripeConnectStatus()
        // Clean up URL param
        window.history.replaceState({}, "", "/account")
      }

      const [subResult, teamResult, connectResult] = await Promise.all([
        getSubscriptionAndDayPassStatus(),
        getTeamData(),
        getStripeConnectStatus(),
      ])
      setConnectStatus(connectResult)

      const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })

      setData({
        email: user.email ?? "",
        name: user.user_metadata?.full_name ?? "",
        memberSince,
        isSubscribed: subResult.isSubscribed,
        plan: subResult.isSubscribed ? "Pro" : "Free",
        activeMembers: teamResult.members.filter(m => m.status === "active").length,
        pendingMembers: teamResult.members.filter(m => m.status === "pending").length,
        seatLimit: teamResult.seatLimit,
        isDayPassActive: subResult.isDayPassActive,
        dayPassExpiresAt: subResult.dayPassExpiresAt,
      })
      setLoading(false)
    }
    load()
  }, [router])

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data || !supportTopic || !supportSubject || !supportMessage) return
    setSendingSupport(true)
    try {
      const fullSubject = `[${supportTopic}] ${supportSubject}`
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: fullSubject,
          message: supportMessage,
          userEmail: data.email,
        }),
      })
      if (res.ok) {
        toast.success("Support ticket sent — we'll be in touch shortly.")
        setShowSupportDialog(false)
        setSupportTopic("")
        setSupportSubject("")
        setSupportMessage("")
      } else {
        toast.error("Failed to send support ticket. Please try again.")
      }
    } catch {
      toast.error("Failed to send support ticket. Please try again.")
    } finally {
      setSendingSupport(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Account</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account settings and subscription
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-40 animate-pulse rounded-xl bg-muted ${i === 2 ? "md:col-span-2" : ""}`} />
            ))}
          </div>
        ) : data && (
          <div className="grid gap-6 md:grid-cols-2">

            {/* Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    {!editingName && (
                      <button
                        onClick={() => { setDraftName(data.name); setEditingName(true) }}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    )}
                  </div>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={draftName}
                        onChange={e => setDraftName(e.target.value)}
                        placeholder="Your full name"
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false) }}
                      />
                      <button onClick={saveName} disabled={savingProfile} className="text-primary hover:text-primary/80">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-foreground">{data.name || <span className="text-muted-foreground italic text-sm">Not set</span>}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    {!editingEmail && (
                      <button
                        onClick={() => { setDraftEmail(data.email); setEditingEmail(true) }}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    )}
                  </div>
                  {editingEmail ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="email"
                        value={draftEmail}
                        onChange={e => setDraftEmail(e.target.value)}
                        placeholder="new@email.com"
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") saveEmail(); if (e.key === "Escape") setEditingEmail(false) }}
                      />
                      <button onClick={saveEmail} disabled={savingProfile} className="text-primary hover:text-primary/80">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingEmail(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-foreground">{data.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm text-muted-foreground">Password</Label>
                    {!editingPassword && (
                      <button
                        onClick={() => { setDraftPassword(""); setDraftPasswordConfirm(""); setEditingPassword(true) }}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Pencil className="h-3 w-3" /> Reset
                      </button>
                    )}
                  </div>
                  {editingPassword ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={draftPassword}
                            onChange={e => setDraftPassword(e.target.value)}
                            placeholder="New password (min 8 chars)"
                            className="h-8 text-sm pr-8"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showPasswordConfirm ? "text" : "password"}
                            value={draftPasswordConfirm}
                            onChange={e => setDraftPasswordConfirm(e.target.value)}
                            placeholder="Confirm new password"
                            className="h-8 text-sm pr-8"
                            onKeyDown={e => { if (e.key === "Enter") savePassword(); if (e.key === "Escape") setEditingPassword(false) }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordConfirm(v => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPasswordConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <button onClick={savePassword} disabled={savingProfile} className="text-primary hover:text-primary/80">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingPassword(false)} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium tracking-widest text-foreground">••••••••</p>
                  )}
                </div>

                {/* Member Since */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                  <p className="font-medium text-foreground">{data.memberSince}</p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Subscription
                </CardTitle>
                <CardDescription>Your current plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-medium text-foreground">{data.plan}</p>
                      <Badge variant={data.isSubscribed ? "default" : "secondary"}>
                        {data.plan}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">Day Pass</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {data.isDayPassActive && data.dayPassExpiresAt ? (
                      <>
                        <p className="font-medium text-foreground">
                          Active &mdash; <DayPassTimeLeft expiresAt={data.dayPassExpiresAt} />
                        </p>
                        <Badge variant="default">Active</Badge>
                      </>
                    ) : (
                      <p className="font-medium text-muted-foreground">Not active</p>
                    )}
                  </div>
                </div>

                {!data.isSubscribed ? (
                  <Button asChild className="w-full">
                    <Link href="/pricing">
                      Upgrade to Pro
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/pricing">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Manage Billing
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-sm"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      Cancel subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team
                </CardTitle>
                <CardDescription>
                  {data.isSubscribed
                    ? `${data.activeMembers + data.pendingMembers} of ${data.seatLimit} seats used`
                    : "Pro plan required for team members"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.isSubscribed ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active members</span>
                      <span className="font-medium">{data.activeMembers}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pending invites</span>
                      <span className="font-medium">{data.pendingMembers}</span>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/dashboard/team">Manage Team</Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/pricing">
                      Upgrade to add team members
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Processing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Payment Processing
                </CardTitle>
                <CardDescription>
                  Connect your Stripe account to accept client invoice payments directly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!connectStatus ? (
                  <div className="h-8 animate-pulse rounded bg-muted" />
                ) : connectStatus.chargesEnabled ? (
                  // Connected + ready
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-primary">Stripe Connected</p>
                        <p className="text-xs text-muted-foreground">Payments enabled — invoices go directly to your account</p>
                      </div>
                    </div>
                  </div>
                ) : connectStatus.connected ? (
                  // Connected but onboarding incomplete
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Stripe setup incomplete</p>
                        <p className="text-xs text-muted-foreground">Finish setup to start accepting payments</p>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleConnectStripe}
                      disabled={connectLoading}
                    >
                      {connectLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Finish Stripe Setup
                    </Button>
                  </div>
                ) : (
                  // Not connected
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connect your Stripe account so client invoice payments go directly to your business — not to CleanQuote Pro.
                    </p>
                    <Button
                      className="w-full"
                      onClick={handleConnectStripe}
                      disabled={connectLoading}
                    >
                      {connectLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      {connectLoading ? "Redirecting..." : "Connect Stripe"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-primary" />
                  Support
                </CardTitle>
                <CardDescription>Get help with your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Having trouble? Open a support ticket and we&apos;ll get back to you quickly.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setShowSupportDialog(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Open Support Ticket
                </Button>
              </CardContent>
            </Card>

          </div>
        )}


      {/* Support Ticket Dialog */}
      <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" />
              Open a Support Ticket
            </DialogTitle>
            <DialogDescription>
              Tell us what&apos;s going on and we&apos;ll get back to you at {data?.email}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSupportSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="support-topic">Topic <span className="text-destructive">*</span></Label>
                <Select value={supportTopic} onValueChange={setSupportTopic} required>
                  <SelectTrigger id="support-topic">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Billing & Subscription">Billing &amp; Subscription</SelectItem>
                    <SelectItem value="Quote Calculator">Quote Calculator</SelectItem>
                    <SelectItem value="Saved Quotes">Saved Quotes</SelectItem>
                    <SelectItem value="Team Members">Team Members</SelectItem>
                    <SelectItem value="Calendar">Calendar</SelectItem>
                    <SelectItem value="Login / Account Access">Login / Account Access</SelectItem>
                    <SelectItem value="Bug Report">Bug Report</SelectItem>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="support-subject">Subject <span className="text-destructive">*</span></Label>
                <Input
                  id="support-subject"
                  placeholder="Brief summary of your issue"
                  value={supportSubject}
                  onChange={e => setSupportSubject(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="support-message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="support-message"
                  rows={5}
                  placeholder="Describe your issue in detail — what happened, what you expected, and any steps to reproduce it."
                  value={supportMessage}
                  onChange={e => setSupportMessage(e.target.value)}
                  required
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
            <DialogFooter className="shrink-0 border-t border-border px-6 py-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowSupportDialog(false)} disabled={sendingSupport}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendingSupport || !supportTopic || !supportSubject || !supportMessage}
              >
                {sendingSupport ? "Sending..." : "Send Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel subscription?
            </DialogTitle>
            <DialogDescription className="pt-1">
              You&apos;ll keep Pro access until the end of your current billing period. After that, your account reverts to the Free plan and team members will lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={cancelling}>
              Keep subscription
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Yes, cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </main>
    </div>
  )
}
