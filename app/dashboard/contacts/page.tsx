"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { PhoneInput } from "@/components/phone-input"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  getClientContacts,
  createClientContact,
  updateClientContact,
  deleteClientContact,
  updateClientActiveStatus,
  getEmployeeContacts,
  createEmployeeContact,
  updateEmployeeContact,
  deleteEmployeeContact,
} from "@/app/actions/contacts"
import { getActiveClientIdentifiers } from "@/app/actions/calendar"
import { ClientProfileDialog } from "@/components/contacts/client-profile-dialog"
import {
  DEFAULT_AVAILABILITY,
  type ClientContact,
  type EmployeeContact,
  type Availability,
  type DayKey,
} from "@/lib/contacts-types"
import {
  Users,
  UserCheck,
  Plus,
  Pencil,
  Eye,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Search,
  StickyNote,
  Briefcase,
  Upload,
  Star,
  MoreVertical,
  LayoutGrid,
  List,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ImportClientsModal } from "@/components/import-clients-modal"

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
]

// ─── Client form ──────────────────────────────────────────────────────────────

type ClientFields = {
  firstName: string
  lastName: string
  email: string
  phone: string
  street: string
  unit: string
  city: string
  state: string
  zip: string
  notes: string
}

const emptyClient: ClientFields = { firstName: "", lastName: "", email: "", phone: "", street: "", unit: "", city: "", state: "", zip: "", notes: "" }

function fullName(f: Pick<ClientFields, "firstName" | "lastName">) {
  return [f.firstName.trim(), f.lastName.trim()].filter(Boolean).join(" ")
}

function splitName(name: string | null): Pick<ClientFields, "firstName" | "lastName"> {
  const parts = (name ?? "").trim().split(" ")
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") }
}

function parseAddress(addr: string | null): Pick<ClientFields, "street" | "unit" | "city" | "state" | "zip"> {
  if (!addr) return { street: "", unit: "", city: "", state: "", zip: "" }
  const lines = addr.split("\n")
  const street = lines[0] ?? ""
  const unit   = lines[1] ?? ""
  const last   = lines[2] ?? ""
  // last line format: "City, ST 00000"
  const cityStateZip = last.match(/^(.*),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/)
  return {
    street,
    unit,
    city:  cityStateZip?.[1] ?? last,
    state: cityStateZip?.[2] ?? "",
    zip:   cityStateZip?.[3] ?? "",
  }
}

function joinAddress(f: Pick<ClientFields, "street" | "unit" | "city" | "state" | "zip">): string {
  const parts = [f.street.trim()]
  if (f.unit.trim()) parts.push(f.unit.trim())
  const cityLine = [f.city.trim(), f.state.trim()].filter(Boolean).join(", ")
    + (f.zip.trim() ? " " + f.zip.trim() : "")
  if (cityLine.trim()) parts.push(cityLine.trim())
  return parts.join("\n")
}

function ClientForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ClientFields
  onSave: (f: ClientFields) => void
  onCancel: () => void
  saving: boolean
}) {
  const [f, setF] = useState(initial)
  const set = (k: keyof ClientFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>First Name <span className="text-destructive">*</span></Label>
          <Input placeholder="Jane" value={f.firstName} onChange={set("firstName")} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Last Name</Label>
          <Input placeholder="Smith" value={f.lastName} onChange={set("lastName")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Email</Label>
          <Input type="email" placeholder="jane@example.com" value={f.email} onChange={set("email")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Phone</Label>
          <PhoneInput value={f.phone} onChange={v => setF(p => ({ ...p, phone: v }))} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Street Address</Label>
        <AddressAutocomplete
          value={f.street}
          onChange={v => setF(prev => ({ ...prev, street: v }))}
          onSelectParts={parts => setF(prev => ({
            ...prev,
            street: parts.street,
            city: parts.city,
            state: parts.state,
            zip: parts.zip,
          }))}
          placeholder="123 Main St"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Unit / Apt <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input placeholder="Apt 4B" value={f.unit} onChange={set("unit")} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1 flex flex-col gap-1.5">
          <Label>City</Label>
          <Input placeholder="Miami" value={f.city} onChange={set("city")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>State</Label>
          <Input placeholder="FL" value={f.state} onChange={set("state")} maxLength={2} className="uppercase" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Zip</Label>
          <Input placeholder="33101" value={f.zip} onChange={set("zip")} maxLength={10} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Notes</Label>
        <textarea
          rows={3}
          placeholder="Any special instructions or notes..."
          value={f.notes}
          onChange={set("notes")}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={() => onSave(f)} disabled={saving || !f.firstName.trim()}>
          {saving ? "Saving..." : "Save Client"}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─��─ Employee form ────────────────────────────────────────────────────────────

type EmployeeFields = {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  notes: string
  availability: Availability
}

const emptyEmployee: EmployeeFields = {
  firstName: "", lastName: "", email: "", phone: "", role: "", notes: "",
  availability: DEFAULT_AVAILABILITY,
}

function AvailabilityEditor({
  value,
  onChange,
}: {
  value: Availability
  onChange: (v: Availability) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {DAYS.map(({ key, label }) => {
        const day = value[key]
        return (
          <div key={key} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange({ ...value, [key]: { ...day, available: !day.available } })}
              className={`w-10 rounded text-xs font-medium py-1 transition-colors ${
                day.available
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {label}
            </button>
            {day.available ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={day.start}
                  onChange={e => onChange({ ...value, [key]: { ...day, start: e.target.value } })}
                  className="h-7 w-28 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={day.end}
                  onChange={e => onChange({ ...value, [key]: { ...day, end: e.target.value } })}
                  className="h-7 w-28 text-xs"
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Unavailable</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EmployeeForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: EmployeeFields
  onSave: (f: EmployeeFields) => void
  onCancel: () => void
  saving: boolean
}) {
  const [f, setF] = useState(initial)
  const set = (k: keyof Omit<EmployeeFields, "availability">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="flex flex-col gap-4 py-2 overflow-y-auto max-h-[70vh] pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>First Name <span className="text-destructive">*</span></Label>
          <Input placeholder="Maria" value={f.firstName} onChange={set("firstName")} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Last Name</Label>
          <Input placeholder="Garcia" value={f.lastName} onChange={set("lastName")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Email</Label>
          <Input type="email" placeholder="maria@example.com" value={f.email} onChange={set("email")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Phone</Label>
          <PhoneInput value={f.phone} onChange={v => setF(p => ({ ...p, phone: v }))} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Role</Label>
        <Input placeholder="e.g. Lead Cleaner, Assistant" value={f.role} onChange={set("role")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Notes</Label>
        <textarea
          rows={2}
          placeholder="Any notes about this employee..."
          value={f.notes}
          onChange={set("notes")}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Weekly Availability</Label>
        <AvailabilityEditor
          value={f.availability}
          onChange={av => setF(prev => ({ ...prev, availability: av }))}
        />
      </div>
      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={() => onSave(f)} disabled={saving || !f.firstName.trim()}>
          {saving ? "Saving..." : "Save Employee"}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─── Client row (list view) ───────────────────────────────────────────────────

function ClientRow({
  contact,
  isActive,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  contact: ClientContact
  isActive: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
      <button
        onClick={onView}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors"
        aria-label={`View ${contact.name}'s profile`}
      >
        {contact.name.charAt(0).toUpperCase()}
      </button>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4">
        <div className="flex items-center gap-2">
          <button onClick={onView} className="font-medium text-foreground text-sm truncate hover:text-primary hover:underline text-left">
            {contact.name}
          </button>
          {isActive && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
              <Star className="h-2.5 w-2.5 fill-current" />
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          {contact.email && (
            <>
              <Mail className="h-3 w-3 shrink-0 hidden sm:block" />
              <a href={`mailto:${contact.email}`} className="hover:text-primary truncate">{contact.email}</a>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {contact.phone && (
            <>
              <Phone className="h-3 w-3 shrink-0 hidden sm:block" />
              <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          {contact.address && (
            <>
              <MapPin className="h-3 w-3 shrink-0 hidden sm:block" />
              <span className="truncate">{contact.address.split("\n")[0]}</span>
            </>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onView} className="gap-2">
            <Eye className="h-3.5 w-3.5" />
            View profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit} className="gap-2">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleActive} className="gap-2">
            <Star className={`h-3.5 w-3.5 ${isActive ? "fill-amber-500 text-amber-500" : ""}`} />
            {isActive ? "Mark Inactive" : "Mark Active"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── Client card ──────────────────────────────────────────────────────────────

function ClientCard({
  contact,
  isActive,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  contact: ClientContact
  isActive: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors"
            aria-label={`View ${contact.name}'s profile`}
          >
            {contact.name.charAt(0).toUpperCase()}
          </button>
          <div className="flex items-center gap-1.5">
            <button onClick={onView} className="font-semibold text-foreground text-sm leading-tight hover:text-primary hover:underline text-left">
              {contact.name}
            </button>
            {isActive && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Star className="h-2.5 w-2.5 fill-current" />
                Active
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onView} className="gap-2">
              <Eye className="h-3.5 w-3.5" />
              View profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive} className="gap-2">
              <Star className={`h-3.5 w-3.5 ${isActive ? "fill-amber-500 text-amber-500" : ""}`} />
              {isActive ? "Mark Inactive" : "Mark Active"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        {contact.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 shrink-0" />
            <a href={`mailto:${contact.email}`} className="hover:text-primary truncate">{contact.email}</a>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
          </div>
        )}
        {contact.address && (
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="text-xs leading-relaxed">
              {contact.address.split("\n").map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </span>
          </div>
        )}
        {contact.notes && (
          <div className="flex items-start gap-1.5">
            <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{contact.notes}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Employee row (list view) ─────────────────────────────────────────────────

function EmployeeRow({
  contact,
  onEdit,
  onDelete,
}: {
  contact: EmployeeContact
  onEdit: () => void
  onDelete: () => void
}) {
  const availableDays = DAYS.filter(d => contact.availability?.[d.key]?.available)

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
        {contact.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-1 sm:gap-4 items-center">
        <div>
          <p className="font-medium text-foreground text-sm truncate">{contact.name}</p>
          {contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          {contact.email && (
            <>
              <Mail className="h-3 w-3 shrink-0 hidden sm:block" />
              <a href={`mailto:${contact.email}`} className="hover:text-primary truncate">{contact.email}</a>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {contact.phone && (
            <>
              <Phone className="h-3 w-3 shrink-0 hidden sm:block" />
              <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
            </>
          )}
        </div>
        <div className="col-span-2 flex flex-wrap gap-1">
          {availableDays.length > 0 ? (
            availableDays.map(({ key, label }) => (
              <span
                key={key}
                className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium"
              >
                {label}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No availability set</span>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onEdit} className="gap-2">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── Employee card ────────────────────────────────────────────────────────────

function EmployeeCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: EmployeeContact
  onEdit: () => void
  onDelete: () => void
}) {
  const availableDays = DAYS.filter(d => contact.availability?.[d.key]?.available)

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm leading-tight">{contact.name}</p>
            {contact.role && (
              <p className="text-xs text-muted-foreground">{contact.role}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        {contact.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 shrink-0" />
            <a href={`mailto:${contact.email}`} className="hover:text-primary truncate">{contact.email}</a>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
          </div>
        )}
        {contact.notes && (
          <div className="flex items-start gap-1.5">
            <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{contact.notes}</span>
          </div>
        )}
      </div>

      {/* Availability chips */}
      <div className="border-t border-border pt-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">Availability</p>
        <div className="flex flex-wrap gap-1">
          {DAYS.map(({ key, label }) => {
            const day = contact.availability?.[key]
            const on = day?.available
            return (
              <span
                key={key}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  on
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
                {on && day?.start && (
                  <span className="ml-1 opacity-70">{day.start}–{day.end}</span>
                )}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [tab, setTab] = useState<"clients" | "employees">("clients")
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  const [clients, setClients] = useState<ClientContact[]>([])
  const [employees, setEmployees] = useState<EmployeeContact[]>([])
  const [loading, setLoading] = useState(true)

  // Calendar-derived active client identifiers (names, emails, phones on calendar)
  const [calendarActiveIds, setCalendarActiveIds] = useState<{
    names: Set<string>
    emails: Set<string>
    phones: Set<string>
  }>({ names: new Set(), emails: new Set(), phones: new Set() })

  // Client dialog
  const [clientDialog, setClientDialog] = useState<"add" | "edit" | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientContact | null>(null)
  const [viewingClient, setViewingClient] = useState<ClientContact | null>(null)
  const [savingClient, setSavingClient] = useState(false)
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null)

  // Employee dialog
  const [employeeDialog, setEmployeeDialog] = useState<"add" | "edit" | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeContact | null>(null)
  const [savingEmployee, setSavingEmployee] = useState(false)
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [c, e, activeIds] = await Promise.all([
      getClientContacts(),
      getEmployeeContacts(),
      getActiveClientIdentifiers(),
    ])
    setClients(c)
    setEmployees(e)
    setCalendarActiveIds(activeIds)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Determine if a client is active (manually marked OR has calendar events)
  const isClientActive = useCallback((client: ClientContact): boolean => {
    // If manually marked active, return true
    if (client.is_active) return true
    // Check if client matches any calendar event
    const nameMatch = client.name && calendarActiveIds.names.has(client.name.toLowerCase().trim())
    const emailMatch = client.email && calendarActiveIds.emails.has(client.email.toLowerCase().trim())
    const phoneMatch = client.phone && calendarActiveIds.phones.has(client.phone.replace(/\D/g, ""))
    return nameMatch || emailMatch || phoneMatch
  }, [calendarActiveIds])

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search)
    if (!matchesSearch) return false
    if (activeFilter === "all") return true
    const active = isClientActive(c)
    return activeFilter === "active" ? active : !active
  })
  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.role ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (e.email ?? "").toLowerCase().includes(search.toLowerCase())
  )

  // Toggle active status handler
  async function handleToggleActive(client: ClientContact) {
    const currentActive = isClientActive(client)
    const newActive = !currentActive
    const { error } = await updateClientActiveStatus(client.id, newActive)
    if (error) {
      toast.error(error)
    } else {
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, is_active: newActive } : c))
      toast.success(newActive ? "Marked as active client" : "Marked as inactive")
    }
  }

  // ── Client handlers ──────────────────────────────────────────────────────────

  async function handleSaveClient(f: ClientFields) {
    setSavingClient(true)
    const address = joinAddress(f) || undefined
    if (clientDialog === "add") {
      const { data, error } = await createClientContact({
        name: fullName(f),
        email: f.email || undefined,
        phone: f.phone || undefined,
        address: address || undefined,
        notes: f.notes || undefined,
      })
      if (error) { toast.error(error); setSavingClient(false); return }
      setClients(prev => [...prev, data!].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success("Client added")
    } else if (clientDialog === "edit" && editingClient) {
      const { error } = await updateClientContact(editingClient.id, {
        name: fullName(f),
        email: f.email || null,
        phone: f.phone || null,
        address: joinAddress(f) || null,
        notes: f.notes || null,
      })
      if (error) { toast.error(error); setSavingClient(false); return }
      setClients(prev =>
        prev.map(c => c.id === editingClient.id ? { ...c, address: joinAddress(f) || null, name: fullName(f), email: f.email || null, phone: f.phone || null, notes: f.notes || null } : c)
      )
      toast.success("Client updated")
    }
    setSavingClient(false)
    setClientDialog(null)
    setEditingClient(null)
  }

  async function handleDeleteClient() {
    if (!deleteClientId) return
    const { error } = await deleteClientContact(deleteClientId)
    if (error) { toast.error(error); return }
    setClients(prev => prev.filter(c => c.id !== deleteClientId))
    setDeleteClientId(null)
    toast.success("Client deleted")
  }

  // ── Employee handlers ─────────────────────────────────────────────────────────

  async function handleSaveEmployee(f: EmployeeFields) {
    setSavingEmployee(true)
    if (employeeDialog === "add") {
      const { data, error } = await createEmployeeContact({
        name: fullName(f),
        email: f.email || undefined,
        phone: f.phone || undefined,
        role: f.role || undefined,
        notes: f.notes || undefined,
        availability: f.availability,
      })
      if (error) { toast.error(error); setSavingEmployee(false); return }
      setEmployees(prev => [...prev, data!].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success("Employee added")
    } else if (employeeDialog === "edit" && editingEmployee) {
      const { error } = await updateEmployeeContact(editingEmployee.id, {
        name: fullName(f),
        email: f.email || null,
        phone: f.phone || null,
        role: f.role || null,
        notes: f.notes || null,
        availability: f.availability,
      })
      if (error) { toast.error(error); setSavingEmployee(false); return }
      setEmployees(prev =>
        prev.map(e => e.id === editingEmployee.id ? { ...e, ...f } : e)
      )
      toast.success("Employee updated")
    }
    setSavingEmployee(false)
    setEmployeeDialog(null)
    setEditingEmployee(null)
  }

  async function handleDeleteEmployee() {
    if (!deleteEmployeeId) return
    const { error } = await deleteEmployeeContact(deleteEmployeeId)
    if (error) { toast.error(error); return }
    setEmployees(prev => prev.filter(e => e.id !== deleteEmployeeId))
    setDeleteEmployeeId(null)
    toast.success("Employee deleted")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:ml-64">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground">Manage your clients and cleaning employees</p>
        </div>

        {/* Tabs + search + add */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex rounded-lg border border-border bg-muted/40 p-1 gap-1 w-fit">
              <button
                onClick={() => setTab("clients")}
                className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === "clients"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Clients
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[11px]">
                  {clients.length}
                </Badge>
              </button>
              <button
                onClick={() => setTab("employees")}
                className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === "employees"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                Employees
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[11px]">
                  {employees.length}
                </Badge>
              </button>
            </div>
            {/* Active filter - only show for clients tab */}
            {tab === "clients" && (
              <div className="flex rounded-lg bg-muted p-0.5 gap-0.5 w-fit">
                {(["all", "active", "inactive"] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      activeFilter === filter
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter === "active" && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 w-48 text-sm"
              />
            </div>
            {tab === "clients" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Import Clients
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                if (tab === "clients") {
                  setEditingClient(null)
                  setClientDialog("add")
                } else {
                  setEditingEmployee(null)
                  setEmployeeDialog("add")
                }
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add {tab === "clients" ? "Client" : "Employee"}
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl border border-border bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : tab === "clients" ? (
          filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {search ? "No clients match your search" : "No clients yet"}
              </p>
              {!search && (
                <Button size="sm" variant="outline" onClick={() => { setEditingClient(null); setClientDialog("add") }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add your first client
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map(c => (
                <ClientCard
                  key={c.id}
                  contact={c}
                  isActive={isClientActive(c)}
                  onView={() => setViewingClient(c)}
                  onEdit={() => {
                    setEditingClient(c)
                    setClientDialog("edit")
                  }}
                  onDelete={() => setDeleteClientId(c.id)}
                  onToggleActive={() => handleToggleActive(c)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredClients.map(c => (
                <ClientRow
                  key={c.id}
                  contact={c}
                  isActive={isClientActive(c)}
                  onView={() => setViewingClient(c)}
                  onEdit={() => {
                    setEditingClient(c)
                    setClientDialog("edit")
                  }}
                  onDelete={() => setDeleteClientId(c.id)}
                  onToggleActive={() => handleToggleActive(c)}
                />
              ))}
            </div>
          )
        ) : (
          filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
              <UserCheck className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {search ? "No employees match your search" : "No employees yet"}
              </p>
              {!search && (
                <Button size="sm" variant="outline" onClick={() => { setEditingEmployee(null); setEmployeeDialog("add") }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add your first employee
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map(e => (
                <EmployeeCard
                  key={e.id}
                  contact={e}
                  onEdit={() => {
                    setEditingEmployee(e)
                    setEmployeeDialog("edit")
                  }}
                  onDelete={() => setDeleteEmployeeId(e.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredEmployees.map(e => (
                <EmployeeRow
                  key={e.id}
                  contact={e}
                  onEdit={() => {
                    setEditingEmployee(e)
                    setEmployeeDialog("edit")
                  }}
                  onDelete={() => setDeleteEmployeeId(e.id)}
                />
              ))}
            </div>
          )
        )}
      </main>

      {/* Import clients modal */}
      <ImportClientsModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={load}
      />

      {/* Client dialog */}
      <Dialog
        open={clientDialog !== null}
        onOpenChange={open => { if (!open) { setClientDialog(null); setEditingClient(null) } }}
      >
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={e => e.preventDefault()}
          onPointerDownOutside={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{clientDialog === "add" ? "Add Client" : "Edit Client"}</DialogTitle>
          </DialogHeader>
          <ClientForm
            initial={editingClient ? {
              ...splitName(editingClient.name),
              email: editingClient.email ?? "",
              phone: editingClient.phone ?? "",
              ...parseAddress(editingClient.address ?? null),
              notes: editingClient.notes ?? "",
            } : emptyClient}
            onSave={handleSaveClient}
            onCancel={() => { setClientDialog(null); setEditingClient(null) }}
            saving={savingClient}
          />
        </DialogContent>
      </Dialog>

      {/* Employee dialog */}
      <Dialog
        open={employeeDialog !== null}
        onOpenChange={open => { if (!open) { setEmployeeDialog(null); setEditingEmployee(null) } }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{employeeDialog === "add" ? "Add Employee" : "Edit Employee"}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            initial={editingEmployee ? {
              ...splitName(editingEmployee.name),
              email: editingEmployee.email ?? "",
              phone: editingEmployee.phone ?? "",
              role: editingEmployee.role ?? "",
              notes: editingEmployee.notes ?? "",
              availability: editingEmployee.availability ?? DEFAULT_AVAILABILITY,
            } : emptyEmployee}
            onSave={handleSaveEmployee}
            onCancel={() => { setEmployeeDialog(null); setEditingEmployee(null) }}
            saving={savingEmployee}
          />
        </DialogContent>
      </Dialog>

      {/* Client profile */}
      <ClientProfileDialog
        contact={viewingClient}
        isActive={viewingClient ? isClientActive(viewingClient) : false}
        open={!!viewingClient}
        onOpenChange={open => { if (!open) setViewingClient(null) }}
      />

      {/* Delete client confirm */}
      <AlertDialog open={!!deleteClientId} onOpenChange={open => { if (!open) setDeleteClientId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the client and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete employee confirm */}
      <AlertDialog open={!!deleteEmployeeId} onOpenChange={open => { if (!open) setDeleteEmployeeId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the employee and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
