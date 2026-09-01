"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { Mail, MessageSquare, RotateCcw, Eye, Pencil, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { updateTemplate, resetTemplateToDefault } from "@/app/actions/communications"
import {
  MERGE_FIELDS,
  MESSAGE_DEFINITIONS,
  renderPreview,
  type Channel,
  type CommunicationTemplate,
} from "@/lib/communications"

interface Props {
  initialTemplates: CommunicationTemplate[]
  loadError: string | null
}

const SMS_SEGMENT = 160

export function TemplatesManager({ initialTemplates, loadError }: Props) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [channel, setChannel] = useState<Channel>("email")
  const [selectedKey, setSelectedKey] = useState<string>(MESSAGE_DEFINITIONS[0].key)
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [pending, startTransition] = useTransition()

  const current = useMemo(
    () => templates.find((t) => t.key === selectedKey && t.channel === channel) ?? null,
    [templates, selectedKey, channel],
  )

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Could not load templates: {loadError}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Channel toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
          {(["email", "sms"] as Channel[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                channel === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              {c === "email" ? "Email" : "SMS"}
            </button>
          ))}
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          {templates.filter((t) => t.channel === channel && !t.is_default).length} of {MESSAGE_DEFINITIONS.length} customized
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Template list */}
        <aside className="rounded-lg border border-border bg-card">
          <ul className="flex flex-col divide-y divide-border">
            {MESSAGE_DEFINITIONS.map((d) => {
              const t = templates.find((x) => x.key === d.key && x.channel === channel)
              const active = d.key === selectedKey
              return (
                <li key={d.key}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(d.key)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                      active ? "bg-primary/5 text-primary" : "text-foreground hover:bg-muted/60",
                    )}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-xs text-muted-foreground">{d.trigger}</span>
                    </span>
                    {t && !t.is_default && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Customized" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        {current ? (
          <TemplateEditor
            key={current.id}
            template={current}
            onSaved={(patch) => setTemplates((prev) => prev.map((t) => (t.id === current.id ? { ...t, ...patch } : t)))}
          />
        ) : (
          <section className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            Select a template to edit.
          </section>
        )}
      </div>
    </div>
  )
}

function TemplateEditor({
  template: current,
  onSaved,
}: {
  template: CommunicationTemplate
  onSaved: (patch: Partial<CommunicationTemplate>) => void
}) {
  const channel = current.channel
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [pending, startTransition] = useTransition()
  const [subject, setSubject] = useState(current.subject ?? "")
  const [body, setBody] = useState(current.body)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const dirty = subject !== (current.subject ?? "") || body !== current.body

  function insertToken(token: string) {
    const el = bodyRef.current
    if (!el) {
      setBody((b) => b + token)
      return
    }
    const start = el.selectionStart ?? body.length
    const end = el.selectionEnd ?? body.length
    const next = body.slice(0, start) + token + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  function save() {
    startTransition(async () => {
      const nextSubject = channel === "email" ? subject : null
      const { error } = await updateTemplate(current.id, { subject: nextSubject, body })
      if (error) {
        toast.error(error)
        return
      }
      onSaved({ subject: nextSubject, body, is_default: false })
      toast.success("Template saved")
    })
  }

  function reset() {
    startTransition(async () => {
      const { error } = await resetTemplateToDefault(current.id)
      if (error) {
        toast.error(error)
        return
      }
      const def = MESSAGE_DEFINITIONS.find((d) => d.key === current.key)!
      const s = channel === "email" ? def.email.subject : null
      const b = channel === "email" ? def.email.body : def.sms.body
      setSubject(s ?? "")
      setBody(b)
      onSaved({ subject: s, body: b, is_default: true })
      toast.success("Restored default template")
    })
  }

  const smsChars = body.length
  const smsSegments = Math.max(1, Math.ceil(smsChars / SMS_SEGMENT))

  return (
        <section className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{current.name}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {MESSAGE_DEFINITIONS.find((d) => d.key === current.key)?.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{channel}</Badge>
                  {current.is_default ? <Badge variant="outline">Default</Badge> : <Badge>Customized</Badge>}
                </div>
              </div>

              <div className="inline-flex w-fit rounded-md border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className={cn("flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium", mode === "edit" ? "bg-muted text-foreground" : "text-muted-foreground")}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setMode("preview")}
                  className={cn("flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium", mode === "preview" ? "bg-muted text-foreground" : "text-muted-foreground")}
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
              </div>

              {mode === "edit" ? (
                <div className="flex flex-col gap-4">
                  {channel === "email" && (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="tpl-subject">Subject</Label>
                      <Input id="tpl-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tpl-body">{channel === "email" ? "Body" : "Message"}</Label>
                      {channel === "sms" && (
                        <span className={cn("text-xs", smsChars > SMS_SEGMENT ? "text-amber-600" : "text-muted-foreground")}>
                          {smsChars} chars · {smsSegments} segment{smsSegments > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <Textarea
                      id="tpl-body"
                      ref={bodyRef}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={channel === "email" ? 12 : 5}
                      className="font-mono text-sm leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Insert merge field</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MERGE_FIELDS.map((f) => (
                        <button
                          key={f.token}
                          type="button"
                          onClick={() => insertToken(f.token)}
                          title={f.label}
                          className="rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          {f.token}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  {channel === "email" && (
                    <p className="mb-3 border-b border-border pb-3 text-sm">
                      <span className="text-muted-foreground">Subject: </span>
                      <span className="font-medium text-foreground">{renderPreview(subject)}</span>
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{renderPreview(body)}</p>
                  <p className="mt-3 text-xs text-muted-foreground">Preview uses sample data for merge fields.</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={pending || current.is_default}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Restore default
                </Button>
                <Button type="button" onClick={save} disabled={pending || !dirty}>
                  <Check className="mr-1.5 h-4 w-4" /> {pending ? "Saving…" : "Save template"}
                </Button>
              </div>
        </section>
  )
}
