"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, ChevronDown, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createCalendarEvent, searchSavedQuotes, type SavedQuoteSearchResult } from "@/app/actions/calendar"
import { upsertInvoiceForEvent } from "@/app/actions/invoices"
import { toast } from "sonner"

interface AppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: string // YYYY-MM-DD
  initialQuote?: SavedQuoteSearchResult | null
  onCreated: () => void
}

const PREFERRED_PACKAGE_LABELS: Record<string, string> = {
  "deep-clean": "Deep Clean",
  "move-in-/-move-out": "Move In / Move Out",
  "single": "Standard Clean",
  "monthly": "Monthly",
  "bi-weekly": "Bi-weekly",
  "weekly": "Weekly",
}

function formatPreferredPackage(value: string): string {
  return PREFERRED_PACKAGE_LABELS[value] ?? value
}

const SERVICE_TYPES = [
  "Deep Clean",
  "Move In / Move Out",
  "Standard Clean",
  "Recurring Clean",
  "Post-Construction",
  "Other",
]

const DURATION_OPTIONS = [
  { label: "1 hour", value: "60" },
  { label: "1.5 hours", value: "90" },
  { label: "2 hours", value: "120" },
  { label: "2.5 hours", value: "150" },
  { label: "3 hours", value: "180" },
  { label: "3.5 hours", value: "210" },
  { label: "4 hours", value: "240" },
  { label: "4.5 hours", value: "270" },
  { label: "5 hours", value: "300" },
  { label: "5.5 hours", value: "330" },
  { label: "6 hours", value: "360" },
  { label: "6+ hours", value: "420" },
]

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

export function AppointmentModal({ open, onOpenChange, defaultDate, initialQuote, onCreated }: AppointmentModalProps) {
  // Client info
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")

  // Quote search
  const [quoteSearch, setQuoteSearch] = useState("")
  const [quoteResults, setQuoteResults] = useState<SavedQuoteSearchResult[]>([])
  const [selectedQuote, setSelectedQuote] = useState<SavedQuoteSearchResult | null>(null)
  const [skipQuote, setSkipQuote] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Appointment details
  const [date, setDate] = useState(defaultDate ?? "")
  const [startTime, setStartTime] = useState("09:00")
  const [duration, setDuration] = useState("120")
  const [serviceType, setServiceType] = useState("")
  const [notes, setNotes] = useState("")

  // Recurring
  const [recurring, setRecurring] = useState(false)
  const [recurrenceRule, setRecurrenceRule] = useState<"weekly" | "biweekly" | "monthly">("weekly")
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("")
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState("")
  const [recurrenceEndMode, setRecurrenceEndMode] = useState<"date" | "occurrences">("occurrences")

  const [saving, setSaving] = useState(false)

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setClientName("")
      setClientEmail("")
      setClientPhone("")
      setQuoteSearch("")
      setQuoteResults([])
      setSelectedQuote(initialQuote ?? null)
      setSkipQuote(false)
      if (initialQuote) {
        setQuoteSearch(initialQuote.quote_name ?? initialQuote.client_name ?? "")
        setClientName(initialQuote.client_name ?? "")
        setClientEmail(initialQuote.client_email ?? "")
        setClientPhone(initialQuote.client_phone ?? "")
        setServiceType(initialQuote.preferred_package ?? "")
        setNotes(initialQuote.notes ?? "")
      }
      setDate(defaultDate ?? "")
      setStartTime("09:00")
      setDuration("120")
      setServiceType("")
      setNotes("")
      setRecurring(false)
      setRecurrenceRule("weekly")
      setRecurrenceEndDate("")
      setRecurrenceOccurrences("")
      setRecurrenceEndMode("occurrences")
    }
  }, [open, defaultDate, initialQuote])

  // Live quote search
  useEffect(() => {
    if (skipQuote || quoteSearch.trim().length < 1) {
      setQuoteResults([])
      setSearchOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      const results = await searchSavedQuotes(quoteSearch)
      setQuoteResults(results)
      setSearchOpen(results.length > 0)
    }, 250)
    return () => clearTimeout(timer)
  }, [quoteSearch, skipQuote])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function selectQuote(q: SavedQuoteSearchResult) {
    setSelectedQuote(q)
    setQuoteSearch(q.quote_name ?? q.client_name ?? "")
    setSearchOpen(false)
    if (q.client_name) setClientName(q.client_name)
    if (q.client_email) setClientEmail(q.client_email)
    if (q.client_phone) setClientPhone(q.client_phone)
  }

  function clearQuote() {
    setSelectedQuote(null)
    setQuoteSearch("")
    setQuoteResults([])
  }

  const endTime = addMinutes(startTime, parseInt(duration))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientName.trim()) { toast.error("Client name is required"); return }
    if (!date) { toast.error("Date is required"); return }

    setSaving(true)
    const { data: newEvent, error } = await createCalendarEvent({
      quote_id: selectedQuote?.id,
      event_type: selectedQuote ? "quote-linked" : "manual",
      scheduled_date: date,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      client_name: clientName.trim(),
      client_email: clientEmail.trim() || undefined,
      client_phone: clientPhone.trim() || undefined,
      service_type: serviceType || undefined,
      notes: notes.trim() || undefined,
      recurrence_rule: recurring ? recurrenceRule : undefined,
      recurrence_end_date: recurring && recurrenceEndMode === "date" ? recurrenceEndDate || undefined : undefined,
      recurrence_occurrences: recurring && recurrenceEndMode === "occurrences" && recurrenceOccurrences
        ? parseInt(recurrenceOccurrences)
        : undefined,
    })

    if (error) { setSaving(false); toast.error("Failed to create appointment"); return }

    // Auto-create invoice draft — best effort, don't block on failure
    if (newEvent?.id) {
      const jobTitle = selectedQuote?.quote_name ?? clientName.trim()
      const address = selectedQuote?.home_address ?? undefined
      const price = selectedQuote
        ? (selectedQuote.result_standard ?? selectedQuote.result_deep_clean ?? selectedQuote.result_move_in ?? 0)
        : 0

      await upsertInvoiceForEvent({
        calendarEventId: newEvent.id,
        quoteId: selectedQuote?.id ?? null,
        invoiceTitle: `Invoice — ${jobTitle}`,
        clientName: clientName.trim() || null,
        clientEmail: clientEmail.trim() || null,
        clientPhone: clientPhone.trim() || null,
        homeAddress: address ?? null,
        amountTotal: price,
        amountDue: price,
      })
    }

    setSaving(false)
    toast.success("Appointment scheduled")
    onOpenChange(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle className="text-base font-semibold">New Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Section 1: Client Info */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client Info</p>
              <div className="space-y-2">
                <Label htmlFor="client-name" className="text-sm">
                  Client Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="client-name"
                  placeholder="Jane Smith"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="client-email" className="text-sm">Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="jane@example.com"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone" className="text-sm">Phone</Label>
                  <Input
                    id="client-phone"
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Link Quote */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link to Quote</p>
              <div
                className={cn("space-y-2 transition-opacity", skipQuote && "pointer-events-none opacity-40")}
                ref={searchRef}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search saved quotes..."
                    className="pl-9 pr-8"
                    value={quoteSearch}
                    onChange={e => { setQuoteSearch(e.target.value); if (selectedQuote) clearQuote() }}
                    disabled={skipQuote}
                  />
                  {selectedQuote && (
                    <button
                      type="button"
                      onClick={clearQuote}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {searchOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
                      {quoteResults.map(q => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => selectQuote(q)}
                          className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-muted/50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          <span className="text-sm font-medium text-foreground">{q.quote_name ?? "Unnamed Quote"}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {q.client_name && <span>{q.client_name}</span>}
                            {q.home_address && <span className="truncate max-w-[180px]">{q.home_address}</span>}
                            {q.result_standard != null && <span className="ml-auto font-medium text-primary">${q.result_standard}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedQuote && (
                  <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
                    <span className="font-medium">Linked:</span>
                    <span>{selectedQuote.quote_name ?? selectedQuote.client_name}</span>
                  </div>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={skipQuote}
                  onChange={e => { setSkipQuote(e.target.checked); if (e.target.checked) clearQuote() }}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Create without a quote
              </label>
            </div>

            {/* Section 3: Appointment Details */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appointment Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="appt-date" className="text-sm">
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="appt-date"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appt-time" className="text-sm">Start Time</Label>
                  <Input
                    id="appt-time"
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-sm">Estimated Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Service Type</Label>
                    {selectedQuote?.preferred_package && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Client prefers: {formatPreferredPackage(selectedQuote.preferred_package)}
                      </span>
                    )}
                  </div>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt-notes" className="text-sm">Notes</Label>
                <textarea
                  id="appt-notes"
                  rows={2}
                  placeholder="Any special instructions..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Section 4: Recurring */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recurring</p>
                <Switch checked={recurring} onCheckedChange={setRecurring} />
              </div>
              {recurring && (
                <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Frequency</Label>
                    <div className="flex gap-2">
                      {(["weekly", "biweekly", "monthly"] as const).map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRecurrenceRule(r)}
                          className={cn(
                            "flex-1 rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                            recurrenceRule === r
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:bg-muted/50"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">End</Label>
                    <div className="flex gap-2">
                      {(["occurrences", "date"] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setRecurrenceEndMode(m)}
                          className={cn(
                            "flex-1 rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                            recurrenceEndMode === m
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:bg-muted/50"
                          )}
                        >
                          {m === "occurrences" ? "# of jobs" : "End date"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {recurrenceEndMode === "occurrences" ? (
                    <div className="space-y-2">
                      <Label htmlFor="occurrences" className="text-sm">Number of jobs</Label>
                      <Input
                        id="occurrences"
                        type="number"
                        min={2}
                        max={104}
                        placeholder="e.g. 12"
                        value={recurrenceOccurrences}
                        onChange={e => setRecurrenceOccurrences(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-sm">End date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={recurrenceEndDate}
                        onChange={e => setRecurrenceEndDate(e.target.value)}
                        min={date}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border px-6 py-4 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? "Saving..." : "Schedule Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
