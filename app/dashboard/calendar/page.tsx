"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Trash2, MapPin, User, Plus, LinkIcon, Filter, X, RefreshCcw, Sparkles, Home, Check, DollarSign, TrendingUp, Users, BarChart3, ClipboardList, ExternalLink, FileText, Pencil, Receipt, List, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getCalendarEvents, deleteCalendarEvent, updateCalendarEvent, type CalendarEvent } from "@/app/actions/calendar"
import { upsertInvoiceForEvent, getInvoicesByQuoteIds, type Invoice } from "@/app/actions/invoices"
import { getEmployeeContacts } from "@/app/actions/contacts"
import { getClientContacts } from "@/app/actions/contacts"
import type { EmployeeContact, ClientContact } from "@/lib/contacts-types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNav } from "@/components/dashboard-nav"
import { AppointmentModal } from "@/components/appointment-modal"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

function fmt12(time: string | null) {
  if (!time) return null
  const [h, m] = time.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${period}`
}

function fmtDate(date: string) {
  const [y, mo, d] = date.split("-").map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  })
}

export default function CalendarPage() {
  const searchParams = useSearchParams()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-based
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<{ date: string; events: CalendarEvent[] } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [apptModalOpen, setApptModalOpen] = useState(false)
  const [apptDefaultDate, setApptDefaultDate] = useState<string | undefined>(undefined)
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null)
  const [editingPackage, setEditingPackage] = useState(false)
  const [editPackageName, setEditPackageName] = useState("")
  const [editPackagePrice, setEditPackagePrice] = useState("")
  const [savingPackage, setSavingPackage] = useState(false)
  const [view, setView] = useState<"calendar" | "invoice-list">("calendar")
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month")
  const [invoicesByEventId, setInvoicesByEventId] = useState<Record<string, Invoice>>({})

  // Filters
  const [employees, setEmployees] = useState<EmployeeContact[]>([])
  const [clients, setClients] = useState<ClientContact[]>([])
  const [filterCleaners, setFilterCleaners] = useState<string[]>([])
  const [filterClients, setFilterClients] = useState<string[]>([])
  const [filterTypes, setFilterTypes] = useState<string[]>([])

  const SERVICE_TYPES = [
    { key: "recurring", label: "Recurring Cleans", icon: RefreshCcw },
    { key: "move", label: "Move In/Out", icon: Home },
    { key: "deep", label: "Deep Cleans", icon: Sparkles },
    { key: "standard", label: "Standard Cleans", icon: Check },
  ]

  // Load employees and clients for filter dropdowns
  useEffect(() => {
    Promise.all([getEmployeeContacts(), getClientContacts()]).then(([emps, cls]) => {
      setEmployees(emps)
      setClients(cls)
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getCalendarEvents(year, month)
    if (error) toast.error("Failed to load calendar")
    const evs = data ?? []
    setEvents(evs)
    // Load invoices keyed by quote_id for all quote-linked events this month
    if (evs.length) {
      const quoteIds = evs.map(e => e.quote_id).filter(Boolean) as string[]
      const map = quoteIds.length ? await getInvoicesByQuoteIds(quoteIds) : {}
      setInvoicesByEventId(map)
    }
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (searchParams.get("quoteId")) {
      setApptModalOpen(true)
    }
  }, [searchParams])

  // Filter events
  const filteredEvents = events.filter(ev => {
    // Filter by cleaner
    if (filterCleaners.length > 0) {
      const eventCleanerIds = (ev as any).cleaner_ids ?? []
      if (!filterCleaners.some(c => eventCleanerIds.includes(c))) return false
    }

    // Filter by client
    if (filterClients.length > 0) {
      const clientName = ev.event_type === "manual" ? ev.client_name : ev.quote?.client_name
      if (!clientName || !filterClients.some(c => clientName.toLowerCase().includes(c.toLowerCase()))) return false
    }

    // Filter by service type
    if (filterTypes.length > 0) {
      const serviceType = ev.service_type?.toLowerCase() ?? ""
      const hasRecurrence = !!ev.recurrence_rule
      
      const matches = filterTypes.some(type => {
        if (type === "recurring") return hasRecurrence
        if (type === "move") return serviceType.includes("move")
        if (type === "deep") return serviceType.includes("deep")
        if (type === "standard") return serviceType.includes("standard") || (!serviceType.includes("move") && !serviceType.includes("deep") && !hasRecurrence)
        return false
      })
      if (!matches) return false
    }

    return true
  })

  const hasActiveFilters = filterCleaners.length > 0 || filterClients.length > 0 || filterTypes.length > 0

  function clearAllFilters() {
    setFilterCleaners([])
    setFilterClients([])
    setFilterTypes([])
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Build grid
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  let cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Month shows the full month; week and day focus the current date range.
  if (calendarView === "day") {
    const focusedDay = today.getFullYear() === year && today.getMonth() + 1 === month ? today.getDate() : 1
    cells = [focusedDay]
  } else if (calendarView === "week") {
    const focusedDay = today.getFullYear() === year && today.getMonth() + 1 === month ? today.getDate() : 1
    const weekStart = Math.max(1, focusedDay - new Date(year, month - 1, focusedDay).getDay())
    cells = Array.from({ length: 7 }, (_, index) => weekStart + index <= daysInMonth ? weekStart + index : null)
  } else {
    // Pad the month to complete calendar rows.
    while (cells.length % 7 !== 0) cells.push(null)
  }

  const eventsByDay = new Map<number, CalendarEvent[]>()
  for (const ev of filteredEvents) {
    const day = parseInt(ev.scheduled_date.split("-")[2], 10)
    if (!eventsByDay.has(day)) eventsByDay.set(day, [])
    eventsByDay.get(day)!.push(ev)
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()

  function openDay(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelected({ date: dateStr, events: eventsByDay.get(day) ?? [] })
  }

  function openNewAppt(prefillDate?: string) {
    setApptDefaultDate(prefillDate)
    setApptModalOpen(true)
  }

  async function handleSavePackage(eventId: string) {
    setSavingPackage(true)
    const newPrice = editPackagePrice ? parseFloat(editPackagePrice) : undefined
    const { error } = await updateCalendarEvent(eventId, {
      package_name: editPackageName || undefined,
      package_price: newPrice,
    })
    if (!error) {
      setEditingPackage(false)
      const updatedEvent = viewingEvent
        ? { ...viewingEvent, package_name: editPackageName || null, package_price: newPrice ?? null }
        : null
      if (updatedEvent) setViewingEvent(updatedEvent)

      // Upsert the invoice draft with updated package/price
      const ev = updatedEvent ?? viewingEvent
      if (ev) {
        const isManual = ev.event_type === "manual"
        const clientName = isManual ? ev.client_name : ev.quote?.client_name
        const jobName = isManual ? (ev.client_name ?? "Appointment") : (ev.quote?.quote_name ?? "Appointment")
        await upsertInvoiceForEvent({
          calendarEventId: ev.id,
          quoteId: ev.quote_id ?? null,
          invoiceTitle: `Invoice — ${jobName}`,
          clientName: clientName ?? null,
          clientEmail: isManual ? ev.client_email : ev.quote?.client_email ?? null,
          clientPhone: isManual ? ev.client_phone : ev.quote?.client_phone ?? null,
          homeAddress: isManual ? null : ev.quote?.home_address ?? null,
          amountTotal: newPrice ?? 0,
          amountDue: newPrice ?? 0,
        })
      }
      load()
    }
    setSavingPackage(false)
  }

  function startEditingPackage(ev: CalendarEvent) {
    setEditPackageName(ev.package_name ?? "")
    setEditPackagePrice(ev.package_price?.toString() ?? "")
    setEditingPackage(true)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const { error } = await deleteCalendarEvent(id)
    if (error) { toast.error("Failed to delete event"); setDeleting(null); return }
    toast.success("Event removed")
    setDeleting(null)
    await load()
    // Update selected panel
    if (selected) {
      setSelected(prev => prev ? { ...prev, events: prev.events.filter(e => e.id !== id) } : null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:ml-64">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
            <p className="mt-1 text-sm text-muted-foreground">View and manage your scheduled cleaning jobs</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("calendar")}
                className={cn(
                  "h-7 gap-1.5 px-2.5 text-xs font-medium",
                  view === "calendar" && "bg-background shadow-sm text-foreground"
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Calendar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("invoice-list")}
                className={cn(
                  "h-7 gap-1.5 px-2.5 text-xs font-medium",
                  view === "invoice-list" && "bg-background shadow-sm text-foreground"
                )}
              >
                <Receipt className="h-3.5 w-3.5" />
                Invoice List
              </Button>
            </div>
            <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5" aria-label="Calendar view">
              {(["month", "week", "day"] as const).map((mode) => (
                <Button key={mode} variant="ghost" size="sm" onClick={() => setCalendarView(mode)} className={cn("h-7 px-2.5 text-xs capitalize", calendarView === mode && "bg-background shadow-sm text-foreground")}>{mode}</Button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center text-sm font-semibold text-foreground">
                {MONTHS[month - 1]} {year}
              </span>
              <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => openNewAppt()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Appointment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cleaner Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                Cleaner
                {filterCleaners.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{filterCleaners.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
              <DropdownMenuLabel className="text-xs">Filter by Cleaner</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {employees.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">No employees found</div>
              ) : (
                employees.map(emp => (
                  <DropdownMenuCheckboxItem
                    key={emp.id}
                    checked={filterCleaners.includes(emp.id)}
                    onCheckedChange={(checked) => {
                      setFilterCleaners(prev =>
                        checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id)
                      )
                    }}
                  >
                    {emp.name}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Client Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                Client
                {filterClients.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{filterClients.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
              <DropdownMenuLabel className="text-xs">Filter by Client</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {clients.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">No clients found</div>
              ) : (
                clients.map(client => (
                  <DropdownMenuCheckboxItem
                    key={client.id}
                    checked={filterClients.includes(client.name)}
                    onCheckedChange={(checked) => {
                      setFilterClients(prev =>
                        checked ? [...prev, client.name] : prev.filter(n => n !== client.name)
                      )
                    }}
                  >
                    {client.name}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Service Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Clean Type
                {filterTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{filterTypes.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs">Filter by Clean Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SERVICE_TYPES.map(type => (
                <DropdownMenuCheckboxItem
                  key={type.key}
                  checked={filterTypes.includes(type.key)}
                  onCheckedChange={(checked) => {
                    setFilterTypes(prev =>
                      checked ? [...prev, type.key] : prev.filter(t => t !== type.key)
                    )
                  }}
                >
                  <type.icon className="h-3.5 w-3.5 mr-2" />
                  {type.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}

          {/* Active filter count */}
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
            </span>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      {view === "calendar" && <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="border-b border-border bg-muted/20 px-4 py-3 text-sm font-semibold text-foreground">
          {calendarView === "month" ? `${MONTHS[month - 1]} ${year}` : calendarView === "week" ? "Week schedule" : "Day schedule"}
        </div>
        {/* Day headers */}
        <div className={cn("grid border-b border-border bg-muted/30", calendarView === "day" ? "grid-cols-1" : "grid-cols-7")}>
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className={cn("grid", calendarView === "day" ? "grid-cols-1" : "grid-cols-7")}>
          {cells.map((day, i) => {
            const dayEvents = day ? (eventsByDay.get(day) ?? []) : []
            return (
              <div
                key={i}
                onClick={() => {
                  if (!day) return
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  openNewAppt(dateStr)
                }}
                className={cn(
                  "relative min-h-[150px] border-b border-r border-border bg-background p-3 transition-colors sm:min-h-[170px] sm:p-4",
                  i % 7 === 6 && "border-r-0",
                  Math.floor(i / 7) === Math.floor((cells.length - 1) / 7) && "border-b-0",
                  day && "cursor-pointer transition-colors hover:bg-muted/40",
                  !day && "bg-muted/20",
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday(day)
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground",
                      )}
                    >
                      {day}
                    </span>

                    {loading ? null : dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        className={cn(
                          "mt-3 truncate rounded-full border px-2.5 py-2 text-xs font-medium leading-tight shadow-sm",
                          ev.event_type === "manual"
                            ? "border-border bg-muted/70 text-muted-foreground"
                            : "border-primary/20 bg-primary/10 text-primary"
                        )}
                      >
                        {fmt12(ev.start_time) && <span className="mr-1">{fmt12(ev.start_time)}</span>}
                        <span>{ev.event_type === "manual" ? (ev.client_name ?? "Appointment") : (ev.quote?.quote_name ?? "Job")}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</p>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>}

      {/* Invoice List View */}
      {view === "invoice-list" && (() => {
        const monthEvents = filteredEvents.filter(ev => {
          const [y, m] = ev.scheduled_date.split("-").map(Number)
          return y === year && m === month
        }).sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))

        const statusBadge = (inv: Invoice) => {
          const cfg: Record<string, { label: string; className: string }> = {
            draft:    { label: "Draft",    className: "bg-muted text-muted-foreground" },
            sent:     { label: "Sent",     className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
            paid:     { label: "Paid",     className: "bg-primary/10 text-primary" },
            canceled: { label: "Canceled", className: "bg-destructive/10 text-destructive" },
          }
          const c = cfg[inv.status] ?? cfg.draft
          return (
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", c.className)}>
              {c.label}
            </span>
          )
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {monthEvents.length === 0
                  ? `No appointments in ${MONTHS[month - 1]} ${year}`
                  : `${monthEvents.length} appointment${monthEvents.length !== 1 ? "s" : ""} in ${MONTHS[month - 1]} ${year}`}
              </p>
              <a href="/dashboard/invoices" className="text-sm text-primary hover:underline flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5" />
                View All Invoices
              </a>
            </div>

            {monthEvents.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16">
                <List className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No appointments this month</p>
                <Button size="sm" variant="outline" onClick={() => openNewAppt()}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Appointment
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm divide-y divide-border">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_1fr_110px_90px_160px] gap-4 px-5 py-3 bg-muted/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job / Client</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Package</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Invoice</p>
                </div>

                {monthEvents.map(ev => {
                  const isManual = ev.event_type === "manual"
                  const clientName = isManual ? ev.client_name : ev.quote?.client_name
                  const jobName = isManual ? (ev.client_name ?? "Appointment") : (ev.quote?.quote_name ?? "Job")
                  const address = isManual ? null : ev.quote?.home_address
                  const pkg = ev.package_name
                  const price = ev.package_price
                  const invoice = ev.quote_id ? invoicesByEventId[ev.quote_id] : undefined

                  return (
                    <div
                      key={ev.id}
                      className="grid grid-cols-[1fr_1fr_110px_90px_160px] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors"
                    >
                      {/* Job / Client */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{jobName}</p>
                        {clientName && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <User className="h-3 w-3 shrink-0" />{clientName}
                          </p>
                        )}
                      </div>

                      {/* Address */}
                      <div className="min-w-0">
                        {address ? (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />{address}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">—</p>
                        )}
                      </div>

                      {/* Package */}
                      <div>
                        {pkg ? (
                          <div>
                            <p className="text-xs font-medium text-foreground truncate">{pkg}</p>
                            {price != null && (
                              <p className="text-xs text-primary font-semibold">${Number(price).toLocaleString()}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">—</p>
                        )}
                      </div>

                      {/* Date */}
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ev.scheduled_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>

                      {/* Invoice status + action */}
                      <div className="flex items-center justify-end gap-2">
                        {invoice ? (
                          <>
                            {statusBadge(invoice)}
                            {/* Sent invoice: show Resend link */}
                            {invoice.status === "sent" && invoice.stripe_payment_link && (
                              <a
                                href={invoice.stripe_payment_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Resend
                              </a>
                            )}
                            {/* Draft: link to invoices page to send */}
                            {invoice.status === "draft" && (
                              <a
                                href="/dashboard/invoices"
                                className="text-xs text-muted-foreground hover:text-primary hover:underline"
                              >
                                Send
                              </a>
                            )}
                            {/* Paid: checkmark */}
                            {invoice.status === "paid" && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No invoice</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* New appointment modal */}
      <AppointmentModal
        open={apptModalOpen}
        onOpenChange={setApptModalOpen}
        defaultDate={apptDefaultDate}
        onCreated={load}
      />

      {/* In-page scheduling sidebar */}
      {selected && <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold"><CalendarDays className="h-4 w-4 text-primary" />{fmtDate(selected.date)}</h2>
            <p className="text-sm text-muted-foreground">{selected.events.length ? `${selected.events.length} scheduled` : "No jobs scheduled"}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSelected(null)} aria-label="Close scheduling sidebar"><X className="h-4 w-4" /></Button>
        </div> 
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
            <DialogTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              {selected && fmtDate(selected.date)}
            </DialogTitle>
            <DialogDescription>
              {selected?.events.length
                ? `${selected.events.length} job${selected.events.length > 1 ? "s" : ""} scheduled`
                : "No jobs scheduled"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {selected?.events.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8">
                <p className="text-sm text-muted-foreground">No jobs on this day.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelected(null); openNewAppt(selected?.date) }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Appointment
                </Button>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {selected?.events.map(ev => {
                const isManual = ev.event_type === "manual"
                const displayName = isManual
                  ? (ev.client_name ?? "Appointment")
                  : (ev.quote?.quote_name ?? ev.client_name ?? "Unlinked Job")
                const clientName = isManual ? ev.client_name : ev.quote?.client_name
                const phone = isManual ? ev.client_phone : ev.quote?.client_phone
                const address = ev.quote?.home_address

                return (
                  <div
                    key={ev.id}
                    className={cn(
                      "cursor-pointer rounded-lg border p-4 transition-colors",
                      isManual
                        ? "border-border bg-muted/60 hover:bg-muted/80"
                        : "border-primary/20 bg-primary/5 hover:bg-primary/10",
                    )}
                    onClick={() => setViewingEvent(ev)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold text-foreground truncate">{displayName}</p>
                      {isManual ? (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Manual</span>
                      ) : (
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "oklch(0.60 0.15 175 / 0.15)", color: "oklch(0.42 0.13 175)" }}>
                          <LinkIcon className="inline h-2.5 w-2.5 mr-0.5" />Quote
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5">
                      {(ev.start_time || ev.end_time) && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {fmt12(ev.start_time) ?? "—"}
                            {ev.end_time && ` – ${fmt12(ev.end_time)}`}
                          </span>
                        </div>
                      )}
                      {address && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{address}</span>
                        </div>
                      )}
                      {clientName && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          <span>{clientName}</span>
                          {phone && <span className="ml-2 text-muted-foreground">{phone}</span>}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-primary">Click to view details</p>
                  </div>
                )
              })}
            </div>
            {(selected?.events.length ?? 0) > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => { setSelected(null); openNewAppt(selected?.date) }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Another Appointment
              </Button>
            )}
          </div>
        </div>
      </aside>}

      {/* Appointment Details Modal */}
      <Dialog open={!!viewingEvent} onOpenChange={(open) => {
        if (!open) {
          setViewingEvent(null)
          setEditingPackage(false)
        }
      }}>
        <DialogContent className="max-w-lg">
          {viewingEvent && (() => {
            const ev = viewingEvent
            const isManual = ev.event_type === "manual"
            const displayName = isManual
              ? (ev.client_name ?? "Appointment")
              : (ev.quote?.quote_name ?? ev.client_name ?? "Unlinked Job")
            const clientName = isManual ? ev.client_name : ev.quote?.client_name
            const clientEmail = isManual ? ev.client_email : ev.quote?.client_email
            const phone = isManual ? ev.client_phone : ev.quote?.client_phone
            const address = isManual ? null : ev.quote?.home_address
            const packageName = ev.package_name
            const packagePrice = ev.package_price
            const quoteId = ev.quote_id

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Appointment Details
                  </DialogTitle>
                  <DialogDescription>
                    {new Date(ev.scheduled_date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-foreground">{displayName}</h3>

                  {/* Time */}
                  {(ev.start_time || ev.end_time) && (
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Time</p>
                        <p className="text-sm text-muted-foreground">
                          {fmt12(ev.start_time) ?? "—"}
                          {ev.end_time && ` – ${fmt12(ev.end_time)}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Client Info */}
                  {(clientName || clientEmail || phone) && (
                    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                      <User className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Client</p>
                        {clientName && <p className="text-sm text-muted-foreground">{clientName}</p>}
                        {clientEmail && (
                          <a href={`mailto:${clientEmail}`} className="text-sm text-primary hover:underline">{clientEmail}</a>
                        )}
                        {phone && (
                          <a href={`tel:${phone}`} className="block text-sm text-primary hover:underline">{phone}</a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {address && (
                    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Address</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{address}</p>
                      </div>
                    </div>
                  )}

                  {/* Package / Service with Price - Always show for editing */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <p className="text-sm font-medium text-foreground">Cleaning Package & Cost</p>
                      </div>
                      {!editingPackage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingPackage(ev)}
                          className="h-7 px-2 text-xs"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>

                    {editingPackage ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Package Name</label>
                          <Input
                            value={editPackageName}
                            onChange={(e) => setEditPackageName(e.target.value)}
                            placeholder="e.g., Standard Clean, Deep Clean"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Cost ($)</label>
                          <Input
                            type="number"
                            value={editPackagePrice}
                            onChange={(e) => setEditPackagePrice(e.target.value)}
                            placeholder="e.g., 150"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSavePackage(ev.id)}
                            disabled={savingPackage}
                          >
                            {savingPackage ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPackage(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          {packageName ? (
                            <p className="text-base font-semibold text-foreground">{packageName}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No package set</p>
                          )}
                          {ev.service_type && <p className="text-sm text-muted-foreground">{ev.service_type}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Cost</p>
                          {packagePrice ? (
                            <p className="text-xl font-bold text-primary">${typeof packagePrice === 'number' ? packagePrice.toLocaleString() : packagePrice}</p>
                          ) : (
                            <p className="text-lg text-muted-foreground">—</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Checklist Link */}
                    <a
                      href="/cleaning-checklist-template"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-2 rounded-md bg-background border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <ClipboardList className="h-4 w-4 text-primary" />
                      View Cleaning Checklist
                      <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                    </a>
                  </div>

                  {/* Recurrence */}
                  {ev.recurrence_rule && (
                    <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-3">
                      <RefreshCcw className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Recurring</p>
                        <p className="text-sm text-muted-foreground capitalize">{ev.recurrence_rule}</p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {ev.notes && (
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-foreground mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{ev.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between gap-2 pt-4">
                  <div>
                    {!isManual && quoteId && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={`/dashboard/quotes?highlight=${quoteId}`}>
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          View Full Quote
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        handleDelete(ev.id)
                        setViewingEvent(null)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setViewingEvent(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Analytics Section */}
      {(() => {
        // Calculate analytics from filtered events (respects cleaner, client, and type filters)
        const thisMonthFilteredEvents = filteredEvents.filter(ev => {
          const [y, m] = ev.scheduled_date.split("-").map(Number)
          return y === year && m === month
        })

        // Also calculate unfiltered totals for comparison
        const thisMonthAllEvents = events.filter(ev => {
          const [y, m] = ev.scheduled_date.split("-").map(Number)
          return y === year && m === month
        })

        const totalJobs = thisMonthFilteredEvents.length
        const totalJobsUnfiltered = thisMonthAllEvents.length
        const recurringJobs = thisMonthFilteredEvents.filter(ev => !!ev.recurrence_rule).length
        const moveJobs = thisMonthFilteredEvents.filter(ev => ev.service_type?.toLowerCase().includes("move")).length
        const deepJobs = thisMonthFilteredEvents.filter(ev => ev.service_type?.toLowerCase().includes("deep")).length
        const standardJobs = totalJobs - moveJobs - deepJobs

        // Calculate estimated revenue from package prices
        const totalRevenue = thisMonthFilteredEvents.reduce((sum, ev) => {
          const price = (ev as any).package_price ?? 0
          return sum + (typeof price === "number" ? price : parseFloat(price) || 0)
        }, 0)

        // Busiest day calculation
        const dayCount: Record<string, number> = {}
        thisMonthFilteredEvents.forEach(ev => {
          const day = new Date(ev.scheduled_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })
          dayCount[day] = (dayCount[day] || 0) + 1
        })
        const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]

        // Unique clients this month
        const uniqueClients = new Set(
          thisMonthFilteredEvents.map(ev => 
            ev.event_type === "manual" ? ev.client_name : ev.quote?.client_name
          ).filter(Boolean)
        ).size

        return (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Monthly Analytics
                {hasActiveFilters && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">(Filtered)</span>
                )}
              </h2>
              {hasActiveFilters && (
                <span className="text-xs text-muted-foreground">
                  Showing {totalJobs} of {totalJobsUnfiltered} jobs
                </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Jobs */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{totalJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    {MONTHS[month - 1]} {year}
                  </p>
                </CardContent>
              </Card>

              {/* Estimated Revenue */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Est. Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From scheduled jobs
                  </p>
                </CardContent>
              </Card>

              {/* Unique Clients */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unique Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{uniqueClients}</div>
                  <p className="text-xs text-muted-foreground">
                    {busiestDay ? `Busiest: ${busiestDay[0]}` : "No jobs yet"}
                  </p>
                </CardContent>
              </Card>

              {/* Job Breakdown */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Job Breakdown</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <RefreshCcw className="h-3 w-3" /> Recurring
                      </span>
                      <span className="font-medium text-foreground">{recurringJobs}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Home className="h-3 w-3" /> Move In/Out
                      </span>
                      <span className="font-medium text-foreground">{moveJobs}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Sparkles className="h-3 w-3" /> Deep Clean
                      </span>
                      <span className="font-medium text-foreground">{deepJobs}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Check className="h-3 w-3" /> Standard
                      </span>
                      <span className="font-medium text-foreground">{standardJobs}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      })()}
      </div>
    </div>
  )
}
