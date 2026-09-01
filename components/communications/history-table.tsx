"use client"

import { useMemo, useState } from "react"
import { Mail, MessageSquare, Search, Inbox } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { MESSAGE_DEFINITIONS, type Channel, type CommunicationEvent, type EventStatus } from "@/lib/communications"

interface Props {
  events: CommunicationEvent[]
  loadError: string | null
}

const STATUS_STYLES: Record<EventStatus, string> = {
  queued: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-primary/10 text-primary border-primary/20",
  sent: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  canceled: "bg-muted text-muted-foreground border-border line-through",
}

function messageLabel(key: string) {
  return MESSAGE_DEFINITIONS.find((d) => d.key === key)?.name ?? key.replace(/_/g, " ")
}

function fmt(ts: string | null) {
  if (!ts) return "—"
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function HistoryTable({ events, loadError }: Props) {
  const [q, setQ] = useState("")
  const [channel, setChannel] = useState<"all" | Channel>("all")
  const [status, setStatus] = useState<"all" | EventStatus>("all")

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return events.filter((e) => {
      if (channel !== "all" && e.channel !== channel) return false
      if (status !== "all" && e.status !== status) return false
      if (!term) return true
      return [e.customer_name, e.customer_email, e.customer_phone, messageLabel(e.message_type), e.subject]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term))
    })
  }, [events, q, channel, status])

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Could not load history: {loadError}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer, message, or subject"
            className="pl-9"
            aria-label="Search history"
          />
        </div>
        <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
          <SelectTrigger className="w-full sm:w-36" aria-label="Filter by channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-36" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_STYLES) as EventStatus[]).map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">{events.length === 0 ? "No messages yet" : "No matches"}</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
                {events.length === 0
                  ? "Emails and texts sent by your automations will appear here once delivery is connected."
                  : "Try a different search or clear the filters."}
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Customer</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{e.customer_name ?? "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">
                        {e.channel === "email" ? e.customer_email : e.customer_phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                      {e.channel === "email" ? (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      )}
                      {e.channel === "email" ? "Email" : "SMS"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{messageLabel(e.message_type)}</span>
                      {e.subject && <span className="max-w-[260px] truncate text-xs text-muted-foreground">{e.subject}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[e.status])}>
                      {e.status}
                    </Badge>
                    {e.status === "failed" && e.error_message && (
                      <p className="mt-1 max-w-[220px] truncate text-xs text-destructive" title={e.error_message}>
                        {e.error_message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                    {fmt(e.sent_at ?? e.scheduled_for ?? e.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {events.length} message{events.length === 1 ? "" : "s"}
        </p>
      )}
    </div>
  )
}
