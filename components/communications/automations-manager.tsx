"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, MessageSquare, Clock, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { updateAutomation } from "@/app/actions/communications"
import {
  MESSAGE_DEFINITIONS,
  TIMING_OPTIONS,
  formatTiming,
  type CommunicationAutomation,
  type CommunicationTemplate,
  type Timing,
} from "@/lib/communications"

interface Props {
  initialAutomations: CommunicationAutomation[]
  templates: CommunicationTemplate[]
  loadError: string | null
}

const NONE = "__none__"

export function AutomationsManager({ initialAutomations, templates, loadError }: Props) {
  const [automations, setAutomations] = useState(initialAutomations)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function patch(id: string, input: Parameters<typeof updateAutomation>[1]) {
    const prev = automations
    setAutomations((list) => list.map((a) => (a.id === id ? { ...a, ...input } : a)))
    setSavingId(id)
    const { error } = await updateAutomation(id, input)
    setSavingId(null)
    if (error) {
      setAutomations(prev)
      toast.error(error)
    }
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Could not load automations: {loadError}
      </div>
    )
  }

  const enabledCount = automations.filter((a) => a.enabled).length
  const ordered = MESSAGE_DEFINITIONS.map((d) => automations.find((a) => a.key === d.key)).filter(
    (a): a is CommunicationAutomation => Boolean(a),
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{enabledCount}</span> of {automations.length} automations enabled.
          Messages are queued to History when they fire; delivery providers are connected in Settings.
        </p>
        <Link href="/dashboard/communications/templates" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Edit templates <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {ordered.map((a) => {
          const def = MESSAGE_DEFINITIONS.find((d) => d.key === a.key)!
          const emailTemplates = templates.filter((t) => t.key === a.key && t.channel === "email")
          const smsTemplates = templates.filter((t) => t.key === a.key && t.channel === "sms")
          const saving = savingId === a.id
          const relevantTimings = TIMING_OPTIONS.filter((o) => {
            // Reminders only make sense "before"; follow-ups only "after"; others can be immediate or after.
            if (a.key === "reminder_24h" || a.key === "reminder_2h") return o.value.endsWith("_before")
            if (a.key === "quote_follow_up" || a.key === "payment_reminder" || a.key === "review_request")
              return o.value === "immediately" || o.value.endsWith("_after")
            return o.value === "immediately" || o.value.endsWith("_after")
          })

          return (
            <li
              key={a.id}
              className={cn(
                "rounded-lg border bg-card transition-colors",
                a.enabled ? "border-primary/30" : "border-border",
                saving && "opacity-70",
              )}
            >
              <div className="flex flex-col gap-4 p-4 sm:p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{a.name}</h3>
                      <Badge variant={a.enabled ? "default" : "secondary"}>{a.enabled ? "On" : "Off"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground text-pretty">{a.description ?? def.description}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {def.trigger} · {formatTiming(a.timing)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`auto-${a.id}`} className="sr-only">
                      Enable {a.name}
                    </Label>
                    <Switch
                      id={`auto-${a.id}`}
                      checked={a.enabled}
                      disabled={saving}
                      onCheckedChange={(v) => patch(a.id, { enabled: v })}
                    />
                  </div>
                </div>

                {/* Config row */}
                <div
                  className={cn(
                    "grid gap-4 border-t border-border pt-4 md:grid-cols-3",
                    !a.enabled && "opacity-60",
                  )}
                >
                  {/* Timing */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">When to send</Label>
                    <Select
                      value={a.timing}
                      disabled={saving}
                      onValueChange={(v) => patch(a.id, { timing: v as Timing })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {relevantTimings.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </Label>
                      <Switch
                        aria-label={`Send ${a.name} by email`}
                        checked={a.email_enabled}
                        disabled={saving}
                        onCheckedChange={(v) => patch(a.id, { email_enabled: v })}
                        className="scale-90"
                      />
                    </div>
                    <Select
                      value={a.email_template_id ?? NONE}
                      disabled={saving || !a.email_enabled}
                      onValueChange={(v) => patch(a.id, { email_template_id: v === NONE ? null : v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Choose template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No template</SelectItem>
                        {emailTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.is_default ? "(default)" : "(custom)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SMS */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" /> SMS
                      </Label>
                      <Switch
                        aria-label={`Send ${a.name} by SMS`}
                        checked={a.sms_enabled}
                        disabled={saving}
                        onCheckedChange={(v) => patch(a.id, { sms_enabled: v })}
                        className="scale-90"
                      />
                    </div>
                    <Select
                      value={a.sms_template_id ?? NONE}
                      disabled={saving || !a.sms_enabled}
                      onValueChange={(v) => patch(a.id, { sms_template_id: v === NONE ? null : v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Choose template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No template</SelectItem>
                        {smsTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.is_default ? "(default)" : "(custom)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
