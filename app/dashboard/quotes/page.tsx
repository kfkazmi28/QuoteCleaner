"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Bookmark,
  Trash2,
  MapPin,
  StickyNote,
  Home,
  Pencil,
  Eye,
  ArrowUpFromLine,
  User,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  CalendarCheck,
  Archive,
  ArchiveRestore,
  MoreVertical,
  Send,
  FileDown,
  Clock,
  ImagePlus,
  X,
  CheckCircle2,
  FileText,
  Receipt,
} from "lucide-react"
import { getSavedQuotes, deleteQuote, updateQuote, archiveQuote, markQuoteCompleted, checkQuoteStatusColumn } from "@/app/actions/quotes"
import { createCalendarEvent, getScheduledQuoteIds, getScheduledEventsMap, getScheduledDatesWithEvents, type ScheduledEventInfo, type ScheduledDateEvent } from "@/app/actions/calendar"
import { upsertInvoiceForEvent } from "@/app/actions/invoices"
import { getEmployeeContacts } from "@/app/actions/contacts"
import type { EmployeeContact, DayKey } from "@/lib/contacts-types"
import { toast } from "sonner"
import Link from "next/link"
import { SendQuoteModal, type SendQuoteData } from "@/components/send-quote-modal"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { PhoneInput } from "@/components/phone-input"
import { exportQuotePdf } from "@/lib/export-quote-pdf"
import { ChecklistModal, getDefaultChecklist, getChecklistTitle, getChecklistDescription, type ChecklistSection } from "@/components/checklist-modal"
import { CreateInvoiceModal } from "@/components/create-invoice-modal"
import { getInvoiceByQuoteId } from "@/app/actions/invoices"

interface SavedQuote {
  id: string
  quote_name: string
  home_address: string
  notes?: string | null
  client_name?: string | null
  client_email?: string | null
  client_phone?: string | null
  quote_generated_by?: string | null
  square_footage: string
  clean_level: string
  bedrooms: string
  bathrooms: string
  pets: string
  children: string
  hourly_rate: number
  result_move_in: number
  result_deep_clean: number
  result_standard: number
  result_monthly: number
  result_biweekly: number
  result_weekly: number
  settings_snapshot: Record<string, unknown>
  created_at: string
  updated_at: string
  archived?: boolean
  status?: string | null
  preferred_package?: string | null
  checklist_data?: {
    standard?: { section: string; items: string[] }[]
    deep?: { section: string; items: string[] }[]
    move?: { section: string; items: string[] }[]
  } | null
  photos?: string[] | null
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── View Modal ─────────────────────────────────────────────────────────────

function ViewQuoteModal({
  quote,
  onClose,
  onEdit,
  onLoad,
  onSend,
  onExport,
  onPhotosUpdated,
}: {
  quote: SavedQuote | null
  onClose: () => void
  onEdit: (q: SavedQuote) => void
  onLoad: (q: SavedQuote) => void
  onSend: (q: SavedQuote) => void
  onExport: (q: SavedQuote) => void
  onPhotosUpdated: (quoteId: string, photos: string[]) => void
}) {
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (quote) setPhotos(quote.photos ?? [])
  }, [quote])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!quote || !e.target.files?.length) return
    setUploading(true)
    const newPhotos = [...photos]
    for (const file of Array.from(e.target.files)) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("quoteId", quote.id)
      const res = await fetch("/api/quotes/photos", { method: "POST", body: formData })
      if (res.ok) {
        const { url } = await res.json()
        newPhotos.push(url)
      }
    }
    setPhotos(newPhotos)
    onPhotosUpdated(quote.id, newPhotos)
    setUploading(false)
  }

  const handleDelete = async (url: string) => {
    if (!quote) return
    await fetch("/api/quotes/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, quoteId: quote.id }),
    })
    const updated = photos.filter(p => p !== url)
    setPhotos(updated)
    onPhotosUpdated(quote.id, updated)
  }

  if (!quote) return null
  return (
    <Dialog open={!!quote} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle className="text-lg font-semibold">{quote.quote_name}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {quote.home_address}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Client info */}
          {(quote.client_name || quote.client_email || quote.client_phone) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Client Info</p>
              <div className="rounded-lg border border-border p-3 space-y-2">
                {quote.client_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{quote.client_name}</span>
                  </div>
                )}
                {quote.client_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <a href={`mailto:${quote.client_email}`} className="text-primary hover:underline">{quote.client_email}</a>
                  </div>
                )}
                {quote.client_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <a href={`tel:${quote.client_phone}`} className="hover:underline">{quote.client_phone}</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Home details */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Home Details</p>
            <div className="flex flex-wrap gap-2">
              {quote.square_footage && (
                <Badge variant="secondary" className="text-xs">
                  <Home className="mr-1 h-3 w-3" />{quote.square_footage} sq ft
                </Badge>
              )}
              {quote.bedrooms && <Badge variant="secondary" className="text-xs">{quote.bedrooms} bed</Badge>}
              {quote.bathrooms && <Badge variant="secondary" className="text-xs">{quote.bathrooms} bath</Badge>}
              {quote.clean_level && (
                <Badge variant="outline" className="text-xs capitalize">{quote.clean_level}</Badge>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Pricing</p>
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-sm">
              {[
                { label: "Standard (one-time)", value: quote.result_standard },
                { label: "Deep Clean", value: quote.result_deep_clean },
                { label: "Move In / Move Out", value: quote.result_move_in },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{formatCurrency(value)}</span>
                </div>
              ))}
              <div className="my-1 h-px bg-border" />
              {[
                { label: "Monthly recurring", value: quote.result_monthly },
                { label: "Bi-weekly recurring", value: quote.result_biweekly },
                { label: "Weekly recurring", value: quote.result_weekly },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Notes</p>
              <div className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2.5">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{quote.notes}</p>
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Photos</p>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url) => (
                  <div key={url} className="group relative aspect-square rounded-md overflow-hidden border border-border">
                    <img src={url} alt="Quote photo" className="h-full w-full object-cover" />
                    <button
                      onClick={() => handleDelete(url)}
                      className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center h-5 w-5 rounded-full bg-black/60 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className={`flex items-center gap-2 cursor-pointer w-full rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <ImagePlus className="h-4 w-4 shrink-0" />
              {uploading ? "Uploading..." : "Add photos"}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5" />
            Saved {formatDate(quote.created_at)}
          </div>
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4 flex flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button className="flex-1" onClick={() => { onClose(); onSend(quote) }}>
              <Send className="mr-1.5 h-4 w-4" />Send Quote
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => { onExport(quote) }}>
              <FileDown className="mr-1.5 h-4 w-4" />Export PDF
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => { onClose(); onEdit(quote) }}>
              <Pencil className="mr-1.5 h-4 w-4" />Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditQuoteModal({
  quote,
  onClose,
  onSaved,
}: {
  quote: SavedQuote | null
  onClose: () => void
  onSaved: (updated: SavedQuote) => void
}) {
  const [fields, setFields] = useState({ quote_name: "", home_address: "", notes: "", client_name: "", client_email: "", client_phone: "", quote_generated_by: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (quote) {
      setFields({
        quote_name: quote.quote_name,
        home_address: quote.home_address,
        notes: quote.notes ?? "",
        client_name: quote.client_name ?? "",
        client_email: quote.client_email ?? "",
        client_phone: quote.client_phone ?? "",
        quote_generated_by: quote.quote_generated_by ?? "",
      })
    }
  }, [quote])

  if (!quote) return null

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await updateQuote(quote.id, {
      quote_name: fields.quote_name.trim(),
      home_address: fields.home_address.trim(),
      notes: fields.notes.trim() || undefined,
      client_name: fields.client_name.trim() || undefined,
      client_email: fields.client_email.trim() || undefined,
      client_phone: fields.client_phone.trim() || undefined,
      quote_generated_by: fields.quote_generated_by.trim() || undefined,
    })
    setSaving(false)
    if (error) {
      toast.error("Failed to update quote")
    } else {
      toast.success("Quote updated")
      onSaved(data as SavedQuote)
    }
  }

  return (
    <Dialog open={!!quote} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />Edit Quote
          </DialogTitle>
          <DialogDescription>Update the quote name, address, notes, or client details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Quote Info</p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eq-name">Quote Name <span className="text-destructive">*</span></Label>
                <Input id="eq-name" value={fields.quote_name} onChange={set("quote_name")} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eq-address">Home Address <span className="text-destructive">*</span></Label>
                <AddressAutocomplete
                  id="eq-address"
                  value={fields.home_address}
                  onChange={v => setFields(prev => ({ ...prev, home_address: v }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eq-generated-by">Quote Generated By <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="eq-generated-by" placeholder="e.g. Maria's Cleaning Co." value={fields.quote_generated_by} onChange={set("quote_generated_by")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eq-notes">Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <textarea
                  id="eq-notes"
                  rows={2}
                  value={fields.notes}
                  onChange={set("notes")}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Client Info</p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eq-client-name">Client Name <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="eq-client-name" value={fields.client_name} onChange={set("client_name")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eq-client-email">Client Email <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="eq-client-email" type="email" value={fields.client_email} onChange={set("client_email")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eq-client-phone">Client Phone <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <PhoneInput id="eq-client-phone" value={fields.client_phone} onChange={v => setFields(p => ({ ...p, client_phone: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-border px-6 py-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !fields.quote_name.trim() || !fields.home_address.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cleaner Selector ────��─────────────────��������─────────────────────────────────

function CleanerSelector({
  employees,
  cleanerIds,
  setCleanerIds,
  isAvailable,
}: {
  employees: EmployeeContact[]
  cleanerIds: string[]
  setCleanerIds: (ids: string[]) => void
  isAvailable: (emp: EmployeeContact) => boolean
}) {
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const selectedEmps = employees.filter(e => cleanerIds.includes(e.id))
  
  // Show all employees when dropdown is open, filter when searching
  const displayList = search.trim()
    ? employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : employees

  const toggle = (id: string) => {
    setCleanerIds(cleanerIds.includes(id)
      ? cleanerIds.filter(c => c !== id)
      : [...cleanerIds, id]
    )
  }

  const remove = (id: string) => setCleanerIds(cleanerIds.filter(c => c !== id))

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Assign Cleaners <span className="text-xs text-muted-foreground">(optional)</span></Label>

      {/* Selected cleaner chips */}
      {selectedEmps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedEmps.map(emp => (
            <div
              key={emp.id}
              className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-2.5 py-1"
            >
              <span className="text-xs font-medium">{emp.name}</span>
              {!isAvailable(emp) && (
                <span className="text-xs text-destructive">not available</span>
              )}
              <button
                type="button"
                onClick={() => remove(emp.id)}
                className="text-muted-foreground hover:text-foreground transition-colors leading-none"
                aria-label={`Remove ${emp.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <Input
        placeholder="Search cleaners..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />

      {/* Dropdown list - shows on focus */}
      {isOpen && displayList.length > 0 && (
        <div className="flex flex-col rounded-md border border-input bg-background overflow-hidden max-h-40 overflow-y-auto">
          {displayList.map(emp => {
            const available = isAvailable(emp)
            const selected = cleanerIds.includes(emp.id)
            return (
              <button
                key={emp.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { toggle(emp.id); setSearch("") }}
                className={`flex items-center justify-between px-3 py-2 text-sm transition-colors text-left ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className="font-medium">{emp.name}</span>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {available ? (
                    <span className={`text-xs ${selected ? "text-primary-foreground/70" : "text-emerald-600"}`}>
                      available
                    </span>
                  ) : (
                    <span className={`text-xs ${selected ? "text-primary-foreground/70" : "text-destructive"}`}>
                      not available
                    </span>
                  )}
                  {selected && <span className="text-xs opacity-70">selected</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {isOpen && search.trim() && displayList.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">No cleaners found.</p>
      )}
    </div>
  )
}

// ─── Schedule Modal ──────────────────────────────────────────────────────────

function ScheduleModal({
  quote,
  onClose,
  onScheduled,
}: {
  quote: SavedQuote | null
  onClose: () => void
  onScheduled: (quoteId: string) => void
}) {
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedPackage, setSelectedPackage] = useState("")
  const [packageName, setPackageName] = useState("")
  const [packagePrice, setPackagePrice] = useState("")
  const [cleanerIds, setCleanerIds] = useState<string[]>([])
  const [employees, setEmployees] = useState<EmployeeContact[]>([])
  const [scheduledDates, setScheduledDates] = useState<Record<string, ScheduledDateEvent[]>>({})
  const [saving, setSaving] = useState(false)

  // Fetch employees and scheduled dates on mount
  useEffect(() => {
    getEmployeeContacts().then(data => {
      setEmployees(data)
    })
    getScheduledDatesWithEvents().then(data => {
      setScheduledDates(data)
    })
  }, [])

  // Map JS day index (0=Sun) to DayKey
  const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

  function isAvailable(emp: EmployeeContact): boolean {
    if (!date) return true // no date selected yet — don't flag anyone
    const avail = emp.availability
    if (!avail) return true
    const dayKey = DAY_KEYS[new Date(date + "T12:00:00").getDay()]
    const day = avail[dayKey]
    if (!day?.available) return false
    // If start time is set, check it falls within the cleaner's window
    if (startTime && day.start && day.end) {
      if (startTime < day.start || startTime > day.end) return false
    }
    return true
  }

  // Compute base labor hours using the same formula as the calculator
  const baseLaborHours = (() => {
    if (!quote) return 0
    const snap = (quote.settings_snapshot ?? {}) as Record<string, number>
    const sqftMult     = snap.sqftMultiplier     ?? 0.013
    const bedMins      = snap.bedroomMinutes     ?? 15
    const bathMins     = snap.bathroomMinutes    ?? 20
    const petMins      = snap.petFeeMinutes      ?? 10
    const childMins    = snap.childrenFeeMinutes ?? 5
    const cleanLevelMinutes: Record<string, number> = { "1": 60, "2": 120, "3": 180 }
    const sqft   = parseFloat(quote.square_footage) || 0
    const beds   = parseFloat(quote.bedrooms)       || 0
    const baths  = parseFloat(quote.bathrooms)      || 0
    const pets   = parseFloat(quote.pets)           || 0
    const children = parseFloat(quote.children)     || 0
    const totalMinutes =
      sqft * sqftMult +
      (cleanLevelMinutes[quote.clean_level] ?? 120) +
      beds   * bedMins +
      baths  * bathMins +
      pets   * petMins +
      children * childMins
    return totalMinutes / 60
  })()

  // Per-package hour multipliers matching the calculator
  const PACKAGE_MULTIPLIERS: Record<string, number> = {
    standard: 0.85,
    deep:     1.0,
    move:     1.0, // baseLaborHours + 2 handled below
    monthly:  0.78,
    biweekly: 0.70,
    weekly:   0.60,
  }

  const estimatedHours = (() => {
    if (!quote || baseLaborHours === 0) return null
    if (!selectedPackage) return Math.round(baseLaborHours * 10) / 10
    const mult = PACKAGE_MULTIPLIERS[selectedPackage] ?? 1.0
    const raw  = selectedPackage === "move"
      ? baseLaborHours + 2
      : baseLaborHours * mult
    return Math.round(raw * 4) / 4 // round to nearest quarter hour
  })()

  // Build package options from quote prices
  const packages = quote ? [
    { key: "move",      label: "Move In / Out",  price: quote.result_move_in },
    { key: "deep",      label: "Deep Clean",     price: quote.result_deep_clean },
    { key: "standard",  label: "Standard",       price: quote.result_standard },
    { key: "monthly",   label: "Monthly",        price: quote.result_monthly },
    { key: "biweekly",  label: "Bi-weekly",      price: quote.result_biweekly },
    { key: "weekly",    label: "Weekly",         price: quote.result_weekly },
  ].filter(p => p.price > 0) : []

  // Reset on open
  useEffect(() => {
    if (quote) {
      setDate("")
      setStartTime("")
      setEndTime("")
      setNotes("")
      setSelectedPackage("")
      setPackageName("")
      setPackagePrice("")
      setCleanerIds([])
    }
  }, [quote])

  const handlePackageSelect = (key: string) => {
    setSelectedPackage(key)
    const pkg = packages.find(p => p.key === key)
    if (pkg) {
      setPackageName(pkg.label)
      setPackagePrice(pkg.price.toFixed(2))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quote || !date) return
    setSaving(true)
    const { data: newEvent, error } = await createCalendarEvent({
      quote_id: quote.id,
      scheduled_date: date,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      notes: notes || undefined,
      package_name: packageName || undefined,
      package_price: packagePrice ? parseFloat(packagePrice) : undefined,
      cleaner_ids: cleanerIds.length > 0 ? cleanerIds : undefined,
    })
    if (error) {
      setSaving(false)
      toast.error("Failed to schedule job")
      return
    }

    // Auto-create invoice draft for this event
    if (newEvent?.id) {
      const price = packagePrice ? parseFloat(packagePrice) : 0
      await upsertInvoiceForEvent({
        calendarEventId: newEvent.id,
        quoteId: quote.id,
        invoiceTitle: `Invoice — ${quote.quote_name ?? quote.client_name ?? "Job"}`,
        clientName: quote.client_name ?? null,
        clientEmail: quote.client_email ?? null,
        clientPhone: quote.client_phone ?? null,
        homeAddress: quote.home_address ?? null,
        amountTotal: price,
        amountDue: price,
      })
    }

    setSaving(false)
    toast.success("Job added to calendar")
    onScheduled(quote.id)
    onClose()
  }

  return (
    <Dialog open={!!quote} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Schedule Job
          </DialogTitle>
          <DialogDescription>
            {quote?.quote_name} — pick a date and optional time.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

            {/* Package selector */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sched-pkg-select">Cleaning Package <span className="text-xs text-muted-foreground">(optional)</span></Label>
              {quote?.preferred_package && (() => {
                const label: Record<string, string> = {
                  "move":     "Move In / Move Out",
                  "deep":     "Deep Clean",
                  "standard": "Standard Clean",
                  "monthly":  "Monthly",
                  "biweekly": "Bi-weekly",
                  "weekly":   "Weekly",
                }
                const display = label[quote.preferred_package]
                if (!display) return null
                return (
                  <p className="text-xs text-primary font-medium">
                    Client&apos;s preferred package: {display}
                  </p>
                )
              })()}
              <select
                id="sched-pkg-select"
                value={selectedPackage}
                onChange={e => handlePackageSelect(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a package...</option>
                {packages.map(pkg => (
                  <option key={pkg.key} value={pkg.key}>
                    {pkg.label} — ${pkg.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Editable package name + price — shown once a package is selected */}
            {selectedPackage && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sched-pkg-name">Package Name</Label>
                  <Input
                    id="sched-pkg-name"
                    value={packageName}
                    onChange={e => setPackageName(e.target.value)}
                    placeholder="e.g. Deep Clean"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sched-pkg-price">Price ($)</Label>
                  <Input
                    id="sched-pkg-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={packagePrice}
                    onChange={e => setPackagePrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Date <span className="text-destructive">*</span></Label>
              <div className="flex flex-col gap-2">
                <div className="flex justify-center rounded-md border border-input bg-background">
                  <Calendar
                    mode="single"
                    selected={date ? new Date(date + "T12:00:00") : undefined}
                    onSelect={(d) => setDate(d ? d.toISOString().split("T")[0] : "")}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    modifiers={{
                      booked: (d) => {
                        const dateStr = d.toISOString().split("T")[0]
                        return !!scheduledDates[dateStr]
                      }
                    }}
                    modifiersStyles={{
                      booked: {
                        fontWeight: 600,
                        textDecoration: "underline",
                        textDecorationColor: "oklch(0.6 0.15 175)",
                        textUnderlineOffset: "3px",
                      }
                    }}
                    initialFocus
                  />
                </div>
                {/* Show selected day's schedule or legend */}
                {date && scheduledDates[date] && scheduledDates[date].length > 0 ? (
                  <div className="rounded-md border border-input bg-muted/30 p-2">
                    <p className="text-xs font-medium text-foreground mb-1.5">
                      {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} — {scheduledDates[date].length} job{scheduledDates[date].length > 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                      {scheduledDates[date].map((evt) => (
                        <div key={evt.id} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate flex-1">{evt.quote_name || "Unnamed"}</span>
                          <span className="shrink-0 ml-2">
                            {evt.start_time ? evt.start_time.slice(0, 5) : "No time"}
                            {evt.end_time && ` - ${evt.end_time.slice(0, 5)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sched-start" className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Start Time
                  </Label>
                  <Input
                    id="sched-start"
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sched-end" className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> End Time
                  </Label>
                  <Input
                    id="sched-end"
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              {selectedPackage ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Estimated labor hours:</span>
                  <span className="font-medium text-foreground">
                    1 cleaner — {estimatedHours} hrs
                  </span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="font-medium text-foreground">
                    2 cleaners — {Math.ceil(((estimatedHours ?? 0) / 2) * 2) / 2} hrs
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  Estimated labor hours: <span className="italic">(choose cleaning package)</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sched-notes">Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <textarea
                id="sched-notes"
                rows={2}
                placeholder="Any reminders for this job"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Cleaner selector — search-driven, shown last */}
            {employees.length > 0 && (
              <CleanerSelector
                employees={employees}
                cleanerIds={cleanerIds}
                setCleanerIds={setCleanerIds}
                isAvailable={isAvailable}
              />
            )}
          </div>
          <DialogFooter className="shrink-0 border-t border-border px-6 py-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !date}>
              {saving ? "Scheduling..." : "Add to Calendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ──────────────────────��───��────────────────────────────────────

export default function SavedQuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<SavedQuote[]>([])
  const [preferredPackages, setPreferredPackages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [viewQuote, setViewQuote] = useState<SavedQuote | null>(null)
  const [editQuote, setEditQuote] = useState<SavedQuote | null>(null)
  const [sendQuote, setSendQuote] = useState<SavedQuote | null>(null)
  const [scheduleQuote, setScheduleQuote] = useState<SavedQuote | null>(null)
  const [scheduledQuoteIds, setScheduledQuoteIds] = useState<Set<string>>(new Set())
  const [scheduledEventsMap, setScheduledEventsMap] = useState<Map<string, ScheduledEventInfo>>(new Map())
  const [activeTab, setActiveTab] = useState<"open" | "scheduled" | "completed" | "archived">("open")
  const [isPending, startTransition] = useTransition()
  const [statusColumnReady, setStatusColumnReady] = useState<boolean | null>(null)
  const [checklistModalQuote, setChecklistModalQuote] = useState<SavedQuote | null>(null)
  const [invoiceQuote, setInvoiceQuote] = useState<SavedQuote | null>(null)
  const [invoicedQuoteIds, setInvoicedQuoteIds] = useState<Set<string>>(new Set())
  const [columnFilters, setColumnFilters] = useState({ client: "", address: "", cleaning: "", date: "", price: "" })
  const [sortConfig, setSortConfig] = useState<{ key: "client" | "address" | "cleaning" | "date" | "price"; direction: "asc" | "desc" }>({ key: "date", direction: "desc" })

  useEffect(() => {
    getSavedQuotes().then(({ data, error }) => {
      if (error) toast.error("Failed to load quotes")
      const quotesData = (data as SavedQuote[]) ?? []
      setQuotes(quotesData)
      // Initialize preferred packages from saved data
      const savedPrefs: Record<string, string> = {}
      quotesData.forEach(q => {
        if (q.preferred_package) savedPrefs[q.id] = q.preferred_package
      })
      setPreferredPackages(savedPrefs)
      setLoading(false)
    })
    getScheduledQuoteIds().then(ids => setScheduledQuoteIds(ids))
    getScheduledEventsMap().then(map => setScheduledEventsMap(map))
    // Check if DB has the status column
    checkQuoteStatusColumn().then(ready => setStatusColumnReady(ready))
  }, [])

  const handlePreferredPackageChange = (quoteId: string, pkgKey: string) => {
    const currentPref = preferredPackages[quoteId]
    const newPref = currentPref === pkgKey ? "" : pkgKey
    setPreferredPackages(prev => ({ ...prev, [quoteId]: newPref }))
    // Persist to database
    updateQuote(quoteId, { preferred_package: newPref || undefined })
  }

  const handleDelete = (id: string) => {
    const previousQuotes = quotes
    setQuotes(prev => prev.filter(q => q.id !== id))
    startTransition(async () => {
      const { error } = await deleteQuote(id)
      if (error) {
        setQuotes(previousQuotes)
        toast.error(`Failed to delete quote: ${error}`)
      } else {
        toast.success("Quote deleted")
      }
    })
  }

  const handleEditSaved = (updated: SavedQuote) => {
    setQuotes(prev => prev.map(q => q.id === updated.id ? { ...q, ...updated } : q))
    setEditQuote(null)
  }

  const handleMarkCompleted = (id: string) => {
    if (statusColumnReady === false) {
      toast.error("DB migration required — run scripts/add-quote-status.sql in your Supabase SQL editor.", { duration: 8000 })
      return
    }
    startTransition(async () => {
      const { error } = await markQuoteCompleted(id)
      if (error === "MIGRATION_REQUIRED") {
        setStatusColumnReady(false)
        toast.error("DB migration required — run scripts/add-quote-status.sql in your Supabase SQL editor.", { duration: 8000 })
      } else if (error) {
        toast.error("Failed to mark quote as completed")
      } else {
        setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: "completed" } : q))
        toast.success("Quote marked as completed")
      }
    })
  }

  const handleArchive = (id: string, archive: boolean) => {
    startTransition(async () => {
      const { data, error } = await archiveQuote(id, archive)
      if (error) {
        toast.error(`Failed to ${archive ? "archive" : "restore"} quote`)
      } else {
        setQuotes(prev => prev.map(q => q.id === id ? { ...q, archived: archive } : q))
        toast.success(archive ? "Quote archived" : "Quote restored")
      }
    })
  }

  // Determine if a scheduled quote's appointment is in the past (full datetime-aware)
  const isAppointmentPast = (quoteId: string): boolean => {
    const event = scheduledEventsMap.get(quoteId)
    if (!event) return false
    const dateStr = event.scheduled_date // "YYYY-MM-DD"
    const timeStr = event.start_time     // "HH:MM:SS" or null

    // Build a local datetime: if no time, treat the whole day as past once the date has passed
    const appointmentDate = timeStr
      ? new Date(`${dateStr}T${timeStr}`)
      : new Date(`${dateStr}T00:00:00`) // no time → past once the date itself is past

    return appointmentDate < new Date()
  }

  // Filter quotes by tab
  const openQuotes = quotes.filter(q =>
    !q.archived && !scheduledQuoteIds.has(q.id) && q.status !== "completed"
  )
  const scheduledQuotes = quotes.filter(q =>
    !q.archived && q.status !== "completed" && scheduledQuoteIds.has(q.id) && !isAppointmentPast(q.id)
  )
  const completedQuotes = quotes.filter(q =>
    !q.archived && (q.status === "completed" || (scheduledQuoteIds.has(q.id) && isAppointmentPast(q.id)))
  )
  const archivedQuotes = quotes.filter(q => q.archived)

  const filteredQuotes = activeTab === "open" ? openQuotes
    : activeTab === "scheduled" ? scheduledQuotes
    : activeTab === "completed" ? completedQuotes
    : archivedQuotes

  const displayQuotes = useMemo(() => {
    const selectedPrice = (q: SavedQuote) => {
      const key = preferredPackages[q.id] || "standard"
      return ({ move: q.result_move_in, deep: q.result_deep_clean, standard: q.result_standard, monthly: q.result_monthly, biweekly: q.result_biweekly, weekly: q.result_weekly } as Record<string, number>)[key] ?? q.result_standard
    }
    const selectedCleaning = (q: SavedQuote) => ({ move: "Move In/Out", deep: "Deep Clean", standard: "Standard", monthly: "Monthly", biweekly: "Bi-weekly", weekly: "Weekly" } as Record<string, string>)[preferredPackages[q.id] || "standard"]
    const rows = filteredQuotes.filter(q => {
      const price = String(selectedPrice(q))
      const cleaning = selectedCleaning(q)
      return q.client_name?.toLowerCase().includes(columnFilters.client.toLowerCase()) && q.home_address?.toLowerCase().includes(columnFilters.address.toLowerCase()) && cleaning.toLowerCase().includes(columnFilters.cleaning.toLowerCase()) && formatDate(q.created_at).toLowerCase().includes(columnFilters.date.toLowerCase()) && price.includes(columnFilters.price)
    })
    return [...rows].sort((a, b) => {
      const value = (q: SavedQuote) => ({ client: q.client_name ?? "", address: q.home_address ?? "", cleaning: selectedCleaning(q), date: q.created_at, price: selectedPrice(q) }[sortConfig.key])
      const av = value(a), bv = value(b)
      const comparison = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortConfig.direction === "asc" ? comparison : -comparison
    })
  }, [filteredQuotes, preferredPackages, columnFilters, sortConfig])

  const setSort = (key: typeof sortConfig.key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))

  const quoteToSendData = (q: SavedQuote): SendQuoteData => ({
    quoteId: q.id,
    quoteName: q.quote_name,
    homeAddress: q.home_address,
    clientName: q.client_name,
    clientEmail: q.client_email,
    clientPhone: q.client_phone,
    generatedBy: q.quote_generated_by,
    notes: q.notes,
    resultStandard: q.result_standard,
    resultDeepClean: q.result_deep_clean,
    resultMoveIn: q.result_move_in,
    resultMonthly: q.result_monthly,
    resultBiweekly: q.result_biweekly,
    resultWeekly: q.result_weekly,
    createdAt: q.created_at,
  })

  const handleExport = async (q: SavedQuote) => {
    await exportQuotePdf(quoteToSendData(q))
  }

  const handleLoad = (quote: SavedQuote) => {
    // Build query string from the quote's saved inputs
    const params = new URLSearchParams({
      sqft: quote.square_footage ?? "",
      level: quote.clean_level ?? "",
      beds: quote.bedrooms ?? "",
      baths: quote.bathrooms ?? "",
      pets: quote.pets ?? "",
      children: quote.children ?? "",
    })
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saved Quotes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? "Loading..." : `${quotes.length} saved quote${quotes.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Back to Calculator</Link>
          </Button>
        </div>

        {/* Migration banner — shown when status column is missing */}
        {statusColumnReady === false && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Database migration required</p>
            <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
              Run <code className="rounded bg-amber-100 px-1 font-mono text-xs dark:bg-amber-900">scripts/add-quote-status.sql</code> in your{" "}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase SQL editor</a>{" "}
              to enable the Completed status feature.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setActiveTab("open")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "open"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Open Quotes
            {!loading && <span className="ml-1.5 text-xs text-muted-foreground">({openQuotes.length})</span>}
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "scheduled"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Scheduled
            {!loading && <span className="ml-1.5 text-xs text-muted-foreground">({scheduledQuotes.length})</span>}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "completed"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed
            {!loading && <span className="ml-1.5 text-xs text-muted-foreground">({completedQuotes.length})</span>}
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "archived"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Archived
            {!loading && <span className="ml-1.5 text-xs text-muted-foreground">({archivedQuotes.length})</span>}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 w-2/3 rounded bg-muted" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayQuotes.length === 0 ? (
          <Card className="flex min-h-[320px] flex-col items-center justify-center border-dashed text-center">
            <CardContent className="flex flex-col items-center gap-3 pt-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                {activeTab === "archived" ? (
                  <Archive className="h-7 w-7 text-muted-foreground" />
                ) : activeTab === "scheduled" ? (
                  <CalendarCheck className="h-7 w-7 text-muted-foreground" />
                ) : activeTab === "completed" ? (
                  <CheckCircle2 className="h-7 w-7 text-muted-foreground" />
                ) : (
                  <Bookmark className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <p className="text-base font-medium text-foreground">
                {activeTab === "archived" ? "No archived quotes"
                  : activeTab === "scheduled" ? "No scheduled quotes"
                  : activeTab === "completed" ? "No completed quotes"
                  : "No open quotes"}
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                {activeTab === "archived"
                  ? "Archived quotes will appear here."
                  : activeTab === "scheduled"
                  ? "Schedule a job from an open quote to see it here."
                  : activeTab === "completed"
                  ? "Quotes are moved here automatically once their appointment date has passed, or when marked as completed."
                  : "Generate a quote in the calculator and click \"Save Quote\" to store it here."}
              </p>
              {activeTab === "open" && (
                <Button asChild size="sm" className="mt-2">
                  <Link href="/dashboard">Go to Calculator</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto rounded-md border border-border">
              <div className="grid min-w-[980px] grid-cols-[1.1fr_1.7fr_1fr_1fr_0.8fr_1.5fr] items-center gap-3 bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {([['client', 'Client name'], ['address', 'Address'], ['cleaning', 'Cleaning type'], ['date', 'Quote date'], ['price', 'Price']] as const).map(([key, label]) => <div key={key} className="flex flex-col gap-2"><button type="button" className="flex items-center gap-1 text-left hover:text-foreground" onClick={() => setSort(key)}>{label}<span aria-hidden="true">{sortConfig.key === key ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span></button><Input value={columnFilters[key]} onChange={e => setColumnFilters(prev => ({ ...prev, [key]: e.target.value }))} placeholder="Filter" className="h-7 bg-background text-xs font-normal normal-case tracking-normal" /></div>)}
                <span className="text-right">Actions</span>
              </div>
            {displayQuotes.map(quote => (
              <Card
                key={quote.id}
                className="grid w-full min-w-[980px] grid-cols-[1.1fr_1.7fr_1fr_1fr_0.8fr_1.5fr] items-center gap-3 rounded-none border-0 border-b border-border bg-background px-4 py-3 shadow-none transition-colors hover:bg-muted/30 cursor-pointer"
                onClick={() => setViewQuote(quote)}
              >
                <CardHeader className="contents">
                  <div className="contents">
                    <div className="flex flex-col gap-1 min-w-0">
                      {quote.client_name && <CardTitle className="text-base leading-snug">{quote.client_name}</CardTitle>}
                      {quote.home_address && <p className="truncate text-xs text-muted-foreground">{quote.home_address}</p>}
                      {(scheduledQuoteIds.has(quote.id) || quote.status === "completed") && (() => {
                        const event = scheduledEventsMap.get(quote.id)
                        const pastAppointment = scheduledQuoteIds.has(quote.id) && isAppointmentPast(quote.id)
                        const isCompleted = quote.status === "completed" || pastAppointment
                        const isUpcoming = scheduledQuoteIds.has(quote.id) && !pastAppointment
                        return (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Completed
                                </span>
                              ) : (
                                <>
                                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    style={{ background: "oklch(0.60 0.15 175 / 0.12)", color: "oklch(0.42 0.13 175)" }}>
                                    <CalendarCheck className="h-2.5 w-2.5" /> Scheduled
                                  </span>
                                  {isUpcoming && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 px-2 py-0.5 text-[10px] font-semibold">
                                      Upcoming
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            {event && (
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(event.scheduled_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                {event.start_time && ` at ${event.start_time.slice(0, 5)}`}
                                {event.package_name && ` · ${event.package_name}`}
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    {/* Stop propagation so card click doesn't fire */}
                    <div className="shrink-0" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditQuote(quote)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          {/* Mark as Completed — show for scheduled/upcoming quotes not yet completed */}
                          {!quote.archived && quote.status !== "completed" && (
                            <DropdownMenuItem
                              onClick={() => handleMarkCompleted(quote.id)}
                              disabled={isPending}
                            >
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                              Mark as Completed
                            </DropdownMenuItem>
                          )}
                          {/* Convert to Invoice — show for non-archived, non-canceled quotes */}
                          {!quote.archived && (
                            invoicedQuoteIds.has(quote.id) ? (
                              <DropdownMenuItem asChild>
                                <a href="/dashboard/invoices">
                                  <Receipt className="mr-2 h-3.5 w-3.5" />
                                  View Invoice
                                </a>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => setInvoiceQuote(quote)}>
                                <FileText className="mr-2 h-3.5 w-3.5" />
                                Convert to Invoice
                              </DropdownMenuItem>
                            )
                          )}
                          {/* Move to Archived — show for completed quotes */}
                          {quote.status === "completed" && !quote.archived && (
                            <DropdownMenuItem
                              onClick={() => handleArchive(quote.id, true)}
                              disabled={isPending}
                            >
                              <Archive className="mr-2 h-3.5 w-3.5" />
                              Move to Archived
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleArchive(quote.id, !quote.archived)}
                            disabled={isPending}
                          >
                            {quote.archived ? (
                              <>
                                <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
                                Restore
                              </>
                            ) : (
                              <>
                                <Archive className="mr-2 h-3.5 w-3.5" />
                                Archive
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onSelect={(event) => { event.preventDefault(); handleDelete(quote.id) }}
                            disabled={isPending}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="contents">

                  {/* Selected cleaning tier */}
                  {(() => {
                    const selectedKey = preferredPackages[quote.id] || "standard"
                    const selectedPackage = {
                      move: { label: "Move In/Out", price: quote.result_move_in },
                      deep: { label: "Deep Clean", price: quote.result_deep_clean },
                      standard: { label: "Standard", price: quote.result_standard },
                      monthly: { label: "Monthly", price: quote.result_monthly },
                      biweekly: { label: "Bi-weekly", price: quote.result_biweekly },
                      weekly: { label: "Weekly", price: quote.result_weekly },
                    }[selectedKey as "move" | "deep" | "standard" | "monthly" | "biweekly" | "weekly"]
                    return (
                      <div className="min-w-0" onClick={e => e.stopPropagation()}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">Selected cleaning</p>
                        <div className="mt-2 flex items-center justify-between gap-4">
                          <span className="text-base font-medium text-foreground">{selectedPackage?.label}</span>
                          <span className="text-lg font-semibold text-primary">{formatCurrency(selectedPackage?.price)}</span>
                        </div>
                      </div>
                    )
                  })()}



                  {/* Footer */}
                  <div className="contents">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3 shrink-0" />
                      Quoted on {formatDate(quote.created_at)}
                    </p>
                    {/* Completed tab: show when the cleaning happened */}
                    {activeTab === "completed" && (() => {
                      const event = scheduledEventsMap.get(quote.id)
                      if (event?.scheduled_date) {
                        const d = new Date(event.scheduled_date + "T12:00:00")
                        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        return (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            Cleaned on {label}
                          </p>
                        )
                      }
                      // No scheduled event — manually marked completed
                      const fallbackDate = (quote as any).completed_at ?? quote.updated_at
                      if (fallbackDate) {
                        const label = new Date(fallbackDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        return (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            Marked completed on {label}
                          </p>
                        )
                      }
                      return null
                    })()}
                    <div className="flex items-center justify-between gap-1 lg:justify-end" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setSendQuote(quote)}
                      >
                        <Send className="mr-1 h-3 w-3" />Send
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setScheduleQuote(quote)}
                      >
                        <CalendarCheck className="mr-1 h-3 w-3" />
                        {scheduledQuoteIds.has(quote.id) ? "Reschedule" : "Schedule"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setViewQuote(quote)}
                      >
                        <Eye className="mr-1 h-3 w-3" />View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
              </div>
            </div>
        )}
      </main>

      {/* View Modal */}
      <ViewQuoteModal
        quote={viewQuote}
        onClose={() => setViewQuote(null)}
        onEdit={q => setEditQuote(q)}
        onLoad={handleLoad}
        onSend={q => { setViewQuote(null); setSendQuote(q) }}
        onExport={handleExport}
        onPhotosUpdated={(quoteId, photos) => {
          setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, photos } : q))
          setViewQuote(prev => prev && prev.id === quoteId ? { ...prev, photos } : prev)
        }}
      />

      {/* Edit Modal */}
      <EditQuoteModal
        quote={editQuote}
        onClose={() => setEditQuote(null)}
        onSaved={handleEditSaved}
      />

      {/* Send Modal */}
      <SendQuoteModal
        open={!!sendQuote}
        onClose={() => setSendQuote(null)}
        data={sendQuote ? quoteToSendData(sendQuote) : null}
        onContactSaved={(updated) => {
          if (!sendQuote) return
          setQuotes(prev => prev.map(q =>
            q.id === sendQuote.id
              ? {
                  ...q,
                  quote_generated_by: updated.generatedBy ?? q.quote_generated_by,
                  client_name: updated.clientName ?? q.client_name,
                  client_email: updated.clientEmail ?? q.client_email,
                  client_phone: updated.clientPhone ?? q.client_phone,
                }
              : q
          ))
        }}
      />

      {/* Create Invoice modal */}
      <CreateInvoiceModal
        quote={invoiceQuote}
        onClose={() => setInvoiceQuote(null)}
        onCreated={(invoiceId) => {
          if (invoiceQuote) {
            setInvoicedQuoteIds(prev => new Set([...prev, invoiceQuote.id]))
          }
          setInvoiceQuote(null)
        }}
      />

      {/* Checklist modal — opens from "See checklist" link on a saved quote card */}
      {checklistModalQuote && (() => {
        const pkgKey = preferredPackages[checklistModalQuote.id] ?? "standard"
        const savedData = checklistModalQuote.checklist_data
        // Get the checklist for this specific package from the nested structure
        const pkgChecklist = savedData?.[pkgKey as "standard" | "deep" | "move"]
        const checklist: ChecklistSection[] = (pkgChecklist && pkgChecklist.length > 0)
          ? pkgChecklist
          : getDefaultChecklist(pkgKey)
        return (
          <ChecklistModal
            open={true}
            onClose={() => setChecklistModalQuote(null)}
            title={getChecklistTitle(pkgKey)}
            description={getChecklistDescription(pkgKey)}
            checklist={checklist}
            onSave={(updated) => {
              // Persist the edited checklist back to the correct package key
              const newChecklistData = {
                ...(checklistModalQuote.checklist_data || {}),
                [pkgKey]: updated,
              }
              updateQuote(checklistModalQuote.id, { checklist_data: newChecklistData })
              setQuotes(prev => prev.map(q =>
                q.id === checklistModalQuote.id ? { ...q, checklist_data: newChecklistData } : q
              ))
              setChecklistModalQuote(prev => prev ? { ...prev, checklist_data: newChecklistData } : null)
              toast.success("Checklist saved for this quote")
            }}
          />
        )
      })()}

      {/* Schedule Modal */}
      <ScheduleModal
        quote={scheduleQuote}
        onClose={() => setScheduleQuote(null)}
        onScheduled={(id) => {
          setScheduledQuoteIds(prev => new Set([...prev, id]))
          getScheduledEventsMap().then(map => setScheduledEventsMap(map))
        }}
      />
    </div>
  )
}
