"use client"

import { useState, useTransition } from "react"
import { Clock, MoonStar, Mail, MessageSquare, Check, Plug } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { updateCommunicationSettings } from "@/app/actions/communications"
import { WEEKDAYS, type CommunicationSettings } from "@/lib/communications"

interface Props {
  initial: CommunicationSettings | null
  loadError: string | null
}

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Australia/Sydney",
]

// Postgres `time` comes back as "HH:MM:SS"; inputs want "HH:MM".
const toInput = (t: string) => t.slice(0, 5)

export function SettingsForm({ initial, loadError }: Props) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    business_hours_start: toInput(initial?.business_hours_start ?? "08:00"),
    business_hours_end: toInput(initial?.business_hours_end ?? "18:00"),
    business_days: initial?.business_days ?? ["mon", "tue", "wed", "thu", "fri"],
    quiet_hours_enabled: initial?.quiet_hours_enabled ?? true,
    quiet_hours_start: toInput(initial?.quiet_hours_start ?? "21:00"),
    quiet_hours_end: toInput(initial?.quiet_hours_end ?? "08:00"),
    email_sender_name: initial?.email_sender_name ?? "",
    email_reply_to: initial?.email_reply_to ?? "",
    sms_sender: initial?.sms_sender ?? "",
    timezone: initial?.timezone ?? "America/New_York",
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  function toggleDay(d: string) {
    set(
      "business_days",
      form.business_days.includes(d) ? form.business_days.filter((x) => x !== d) : [...form.business_days, d],
    )
  }

  function save() {
    if (form.email_reply_to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_reply_to)) {
      toast.error("Reply-to must be a valid email address")
      return
    }
    startTransition(async () => {
      const { error } = await updateCommunicationSettings({
        ...form,
        email_sender_name: form.email_sender_name.trim() || null,
        email_reply_to: form.email_reply_to.trim() || null,
        sms_sender: form.sms_sender.trim() || null,
      })
      if (error) {
        toast.error(error)
        return
      }
      toast.success("Communication settings saved")
    })
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Could not load settings: {loadError}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business hours */}
        <Section icon={Clock} title="Business hours" description="Automations that fire outside these hours are held until you open.">
          <div className="flex flex-col gap-1.5">
            <Label>Time zone</Label>
            <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bh-start">Opens</Label>
              <Input id="bh-start" type="time" value={form.business_hours_start} onChange={(e) => set("business_hours_start", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bh-end">Closes</Label>
              <Input id="bh-end" type="time" value={form.business_hours_end} onChange={(e) => set("business_hours_end", e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Working days</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => {
                const on = form.business_days.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDay(d.value)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>
        </Section>

        {/* Quiet hours */}
        <Section icon={MoonStar} title="SMS quiet hours" description="Texts are never sent during this window; they queue until it ends.">
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <Label htmlFor="quiet-toggle" className="cursor-pointer">
              Enable quiet hours
            </Label>
            <Switch id="quiet-toggle" checked={form.quiet_hours_enabled} onCheckedChange={(v) => set("quiet_hours_enabled", v)} />
          </div>
          <div className={cn("grid grid-cols-2 gap-3", !form.quiet_hours_enabled && "opacity-50")}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qh-start">Starts</Label>
              <Input id="qh-start" type="time" disabled={!form.quiet_hours_enabled} value={form.quiet_hours_start} onChange={(e) => set("quiet_hours_start", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qh-end">Ends</Label>
              <Input id="qh-end" type="time" disabled={!form.quiet_hours_enabled} value={form.quiet_hours_end} onChange={(e) => set("quiet_hours_end", e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-pretty">
            Recommended: 9:00 PM to 8:00 AM in your customers&apos; local time to stay compliant with texting regulations.
          </p>
        </Section>

        {/* Email sender */}
        <Section icon={Mail} title="Email sender" description="How your emails appear in the customer's inbox.">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sender-name">Sender name</Label>
            <Input id="sender-name" placeholder="Sparkle Clean Co." value={form.email_sender_name} onChange={(e) => set("email_sender_name", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reply-to">Reply-to email</Label>
            <Input id="reply-to" type="email" placeholder="hello@yourcompany.com" value={form.email_reply_to} onChange={(e) => set("email_reply_to", e.target.value)} />
            <p className="text-xs text-muted-foreground">Customer replies go here.</p>
          </div>
          <ProviderRow label="Email provider" status="not_connected" />
        </Section>

        {/* SMS sender */}
        <Section icon={MessageSquare} title="SMS sender" description="The number or name your texts come from.">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sms-sender">Default SMS sender</Label>
            <Input id="sms-sender" placeholder="+1 (555) 010-0000 or company name" value={form.sms_sender} onChange={(e) => set("sms_sender", e.target.value)} />
            <p className="text-xs text-muted-foreground">Assigned by your SMS provider once connected.</p>
          </div>
          <ProviderRow label="SMS provider" status="not_connected" />
        </Section>
      </div>

      <div className="flex items-center justify-end border-t border-border pt-4">
        <Button onClick={save} disabled={pending}>
          <Check className="mr-1.5 h-4 w-4" /> {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Clock
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground text-pretty">{description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function ProviderRow({ label, status }: { label: string; status: "connected" | "not_connected" }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-foreground">
        <Plug className="h-4 w-4 text-muted-foreground" /> {label}
      </span>
      <Badge variant={status === "connected" ? "default" : "secondary"}>
        {status === "connected" ? "Connected" : "Coming soon"}
      </Badge>
    </div>
  )
}
