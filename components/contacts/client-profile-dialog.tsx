"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getClientHistory } from "@/app/actions/contacts"
import type { ClientContact, ClientHistory } from "@/lib/contacts-types"
import {
  Mail,
  Phone,
  MapPin,
  StickyNote,
  Star,
  CreditCard,
  CalendarDays,
  Receipt,
  Wallet,
} from "lucide-react"

function money(n: number) {
  return `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(d: string | null) {
  if (!d) return "—"
  const date = new Date(d.length <= 10 ? d + "T12:00:00" : d)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(":").map(Number)
  if (Number.isNaN(h)) return null
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m ?? 0).padStart(2, "0")} ${period}`
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  draft: "bg-muted text-muted-foreground",
  canceled: "bg-muted text-muted-foreground line-through",
}

const APPT_STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  canceled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <span className={`text-lg font-semibold ${tone ?? "text-foreground"}`}>{value}</span>
    </div>
  )
}

export function ClientProfileDialog({
  contact,
  isActive,
  open,
  onOpenChange,
}: {
  contact: ClientContact | null
  isActive: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [history, setHistory] = useState<ClientHistory | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !contact) return
    let cancelled = false
    setLoading(true)
    setHistory(null)
    getClientHistory({ name: contact.name, email: contact.email, phone: contact.phone })
      .then(h => { if (!cancelled) setHistory(h) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, contact])

  if (!contact) return null

  const addressLines = contact.address?.split("\n").filter(Boolean) ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {contact.name.charAt(0).toUpperCase()}
            </span>
            <span className="flex items-center gap-2">
              {contact.name}
              {isActive && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Active
                </span>
              )}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Contact details */}
          <div className="grid grid-cols-1 gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-primary truncate">{contact.email}</a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
              </div>
            )}
            {addressLines.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{addressLines.map((l, i) => <span key={i} className="block">{l}</span>)}</span>
              </div>
            )}
            {contact.notes && (
              <div className="flex items-start gap-2">
                <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{contact.notes}</span>
              </div>
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Wallet className="h-3.5 w-3.5" />}
              label="Total Paid"
              value={loading ? "…" : money(history?.totalPaid ?? 0)}
              tone="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              icon={<CreditCard className="h-3.5 w-3.5" />}
              label="Outstanding"
              value={loading ? "…" : money(history?.outstanding ?? 0)}
              tone={(history?.outstanding ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : undefined}
            />
            <StatCard
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label="Appointments"
              value={loading ? "…" : String(history?.appointmentCount ?? 0)}
            />
          </div>

          {/* Payment history */}
          <section className="flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Payment History
            </h3>
            {loading ? (
              <div className="h-16 rounded-lg border border-border bg-muted/30 animate-pulse" />
            ) : history && history.payments.length > 0 ? (
              <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {history.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{p.invoice_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.status === "paid"
                          ? `Paid ${formatDate(p.paid_at)}${p.payment_method ? ` · ${p.payment_method}` : ""}`
                          : p.due_date
                            ? `Due ${formatDate(p.due_date)}`
                            : `Created ${formatDate(p.created_at)}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-semibold text-foreground">{money(p.amount_total)}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${PAYMENT_STATUS_STYLES[p.status] ?? "bg-muted text-muted-foreground"}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No payments recorded for this client yet.
              </p>
            )}
          </section>

          {/* Appointment history */}
          <section className="flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Appointment History
            </h3>
            {loading ? (
              <div className="h-16 rounded-lg border border-border bg-muted/30 animate-pulse" />
            ) : history && history.appointments.length > 0 ? (
              <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {history.appointments.map(a => {
                  const time = formatTime(a.start_time)
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {a.service_type || a.package_name || "Cleaning appointment"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(a.scheduled_date)}{time ? ` · ${time}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {a.package_price != null && (
                          <span className="text-sm font-semibold text-foreground">{money(a.package_price)}</span>
                        )}
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${APPT_STATUS_STYLES[a.status] ?? "bg-muted text-muted-foreground"}`}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No appointments scheduled for this client yet.
              </p>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
