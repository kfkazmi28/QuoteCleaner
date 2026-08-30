"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DashboardNav } from "@/components/dashboard-nav"
import { usePricingSettings, defaultSettings } from "@/contexts/pricing-settings-context"
import { Calculator, Sparkles, Lock, Info, Check, Bookmark, Send, FileDown, Pencil, Trash2, Plus, FolderOpen, ChevronDown, BookmarkPlus, MoreHorizontal } from "lucide-react"
import { getSavedCalculators, saveCalculator, deleteCalculator, renameCalculator, type SavedCalculator } from "@/app/actions/calculators"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getSubscriptionAndDayPassStatus } from "@/app/actions/subscription"
import { createDayPassCheckoutSession } from "@/app/actions/stripe"
import { saveQuote, getDefaultSenderName, setDefaultSenderName } from "@/app/actions/quotes"
import { getClientContacts } from "@/app/actions/contacts"
import type { ClientContact } from "@/lib/contacts-types"
import { SendQuoteModal, type SendQuoteData } from "@/components/send-quote-modal"
import { ChecklistModal, STANDARD_CLEAN_CHECKLIST as _STANDARD_CLEAN_CHECKLIST, DEEP_CLEAN_CHECKLIST as _DEEP_CLEAN_CHECKLIST, MOVE_IN_CHECKLIST as _MOVE_IN_CHECKLIST, type ChecklistSection } from "@/components/checklist-modal"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { PhoneInput } from "@/components/phone-input"
import { exportQuotePdf } from "@/lib/export-quote-pdf"

// Use shared checklist constants from the extracted component
const STANDARD_CLEAN_CHECKLIST = _STANDARD_CLEAN_CHECKLIST
const DEEP_CLEAN_CHECKLIST = _DEEP_CLEAN_CHECKLIST
const MOVE_IN_CHECKLIST = _MOVE_IN_CHECKLIST


interface SaveQuoteFields {
  name: string
  streetAddress: string
  aptUnit: string
  city: string
  state: string
  zip: string
  notes: string
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone: string
  generatedBy: string
}

function SaveQuoteModal({
  open,
  onClose,
  onSave,
  defaultSenderName,
}: {
  open: boolean
  onClose: () => void
  onSave: (fields: SaveQuoteFields, saveAsDefault: boolean) => Promise<void>
  defaultSenderName: string | null
}) {
  const empty: SaveQuoteFields = { name: "", streetAddress: "", aptUnit: "", city: "", state: "", zip: "", notes: "", clientFirstName: "", clientLastName: "", clientEmail: "", clientPhone: "", generatedBy: "" }
  const [fields, setFields] = useState<SaveQuoteFields>(empty)
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [saving, setSaving] = useState(false)
  const [contacts, setContacts] = useState<ClientContact[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const firstNameRef = useRef<HTMLDivElement>(null)

  const suggestions = contacts.filter(c =>
    fields.clientFirstName.trim().length > 0 &&
    c.name.toLowerCase().includes(fields.clientFirstName.toLowerCase())
  )

  const handleSelectContact = (contact: ClientContact) => {
    const parts = contact.name.trim().split(" ")
    const firstName = parts[0] ?? ""
    const lastName = parts.slice(1).join(" ")
    setFields(prev => ({
      ...prev,
      clientFirstName: firstName,
      clientLastName: lastName,
      clientEmail: contact.email ?? prev.clientEmail,
      clientPhone: contact.phone ?? prev.clientPhone,
    }))
    setShowSuggestions(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (firstNameRef.current && !firstNameRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Pre-fill generatedBy from default when modal opens, load contacts
  useEffect(() => {
    if (open) {
      if (defaultSenderName && !fields.generatedBy) {
        setFields(prev => ({ ...prev, generatedBy: defaultSenderName }))
      }
      getClientContacts().then(setContacts)
    }
    if (!open) {
      setFields(empty)
      setSaveAsDefault(false)
      setShowSuggestions(false)
    }
  }, [open, defaultSenderName])

  const set = (key: keyof SaveQuoteFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fields.name.trim() || !fields.streetAddress.trim() || !fields.city.trim() || !fields.state.trim() || !fields.zip.trim()) return
    setSaving(true)
    await onSave({ ...fields, name: fields.name.trim() }, saveAsDefault)
    setSaving(false)
  }

  const isAddressComplete = fields.streetAddress.trim() && fields.city.trim() && fields.state.trim() && fields.zip.trim()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Save Quote
          </DialogTitle>
          <DialogDescription>
            Save this quote with client details for your records.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            {/* Quote Info */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Quote Info</p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sq-name">Quote Name <span className="text-destructive">*</span></Label>
                <Input id="sq-name" placeholder="e.g. Smith House Deep Clean" value={fields.name} onChange={set("name")} required />
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-muted-foreground">Home Address <span className="text-destructive">*</span></p>
                <div className="flex flex-col gap-2">
                  <AddressAutocomplete
                    id="sq-street"
                    value={fields.streetAddress}
                    onChange={v => setFields(prev => ({ ...prev, streetAddress: v }))}
                    onSelectParts={(parts) => setFields(prev => ({
                      ...prev,
                      streetAddress: parts.street,
                      city: parts.city,
                      state: parts.state,
                      zip: parts.zip,
                    }))}
                    placeholder="Street Address"
                    required
                  />
                  <Input 
                    id="sq-apt" 
                    placeholder="Apt, Suite, Unit (optional)" 
                    value={fields.aptUnit} 
                    onChange={set("aptUnit")} 
                  />
                  <div className="grid grid-cols-6 gap-2">
                    <Input 
                      id="sq-city" 
                      placeholder="City" 
                      value={fields.city} 
                      onChange={set("city")} 
                      required 
                      className="col-span-3"
                    />
                    <Input 
                      id="sq-state" 
                      placeholder="State" 
                      value={fields.state} 
                      onChange={set("state")} 
                      required 
                      className="col-span-1"
                    />
                    <Input 
                      id="sq-zip" 
                      placeholder="ZIP" 
                      value={fields.zip} 
                      onChange={set("zip")} 
                      required 
                      className="col-span-2"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sq-generated-by">Quote Generated By <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="sq-generated-by" placeholder="e.g. Maria's Cleaning Co." value={fields.generatedBy} onChange={set("generatedBy")} />
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="sq-save-default"
                    checked={saveAsDefault}
                    onChange={e => setSaveAsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <label htmlFor="sq-save-default" className="text-xs text-muted-foreground cursor-pointer select-none">
                    Set as default for future quotes
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sq-notes">Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <textarea
                  id="sq-notes"
                  rows={2}
                  placeholder="Any special instructions or reminders"
                  value={fields.notes}
                  onChange={set("notes")}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>

            {/* Client Info */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Client Info</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5" ref={firstNameRef}>
                  <Label htmlFor="sq-client-first">First Name <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <div className="relative">
                    <Input
                      id="sq-client-first"
                      placeholder="Jane"
                      value={fields.clientFirstName}
                      autoComplete="off"
                      onChange={e => {
                        setFields(prev => ({ ...prev, clientFirstName: e.target.value }))
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-popover shadow-md overflow-hidden">
                        {suggestions.map(contact => (
                          <button
                            key={contact.id}
                            type="button"
                            onMouseDown={() => handleSelectContact(contact)}
                            className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                          >
                            <span className="font-medium text-foreground">{contact.name}</span>
                            {(contact.phone || contact.email) && (
                              <span className="text-xs text-muted-foreground truncate">
                                {contact.phone || contact.email}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sq-client-last">Last Name <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <Input id="sq-client-last" placeholder="Smith" value={fields.clientLastName} onChange={set("clientLastName")} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sq-client-email">Client Email <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="sq-client-email" type="email" placeholder="e.g. jane@example.com" value={fields.clientEmail} onChange={set("clientEmail")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sq-client-phone">Client Phone <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <PhoneInput id="sq-client-phone" value={fields.clientPhone} onChange={v => setFields(p => ({ ...p, clientPhone: v }))} />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border px-6 py-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !fields.name.trim() || !isAddressComplete}>
              {saving ? "Saving..." : "Save Quote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function roundToQuarter(hours: number): number {
  return Math.round(hours * 4) / 4
}

function formatHours(h: number) {
  const rawMinutes = h * 60
  const totalMinutes = Math.ceil(rawMinutes / 15) * 15
  const hrs = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hrs === 0) return `${mins} min`
  if (mins === 0) return `${hrs} hr`
  return `${hrs} hr ${mins} min`
}

function DayPassCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft("Expired"); return }
      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft(`${h}h ${m}m`)
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [expiresAt])

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center">
      <p className="text-sm font-medium text-primary">
        Day Pass Active &mdash; {timeLeft} remaining
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const {
    settings, updateSettings, resetToDefaults, isLoaded,
    homeDetails, updateHomeDetails,
    quoteResults: results, updateQuoteResults,
    quotesUsed, incrementQuotesUsed,
  } = usePricingSettings()

  const squareFootage = homeDetails.squareFootage
  const cleanLevel = homeDetails.cleanLevel
  const bedrooms = homeDetails.bedrooms
  const bathrooms = homeDetails.bathrooms
  const pets = homeDetails.pets
  const children = homeDetails.children

  const setSquareFootage = (v: string) => updateHomeDetails({ squareFootage: v })
  const setCleanLevel = (v: string) => updateHomeDetails({ cleanLevel: v })
  const setBedrooms = (v: string) => updateHomeDetails({ bedrooms: v })
  const setBathrooms = (v: string) => updateHomeDetails({ bathrooms: v })
  const setPets = (v: string) => updateHomeDetails({ pets: v })
  const setChildren = (v: string) => updateHomeDetails({ children: v })

  const [sqftUnit, setSqftUnit] = useState<"sqft" | "sqm">("sqft")
  const [showPaywall, setShowPaywall] = useState(false)
  const [showCreditConfirm, setShowCreditConfirm] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showDeepClean, setShowDeepClean] = useState(false)
  const [showMoveIn, setShowMoveIn] = useState(false)
  const [showStandardClean, setShowStandardClean] = useState(false)
  const [customDeepClean, setCustomDeepClean] = useState(DEEP_CLEAN_CHECKLIST)
  const [customMoveIn, setCustomMoveIn] = useState(MOVE_IN_CHECKLIST)
  const [customStandardClean, setCustomStandardClean] = useState(STANDARD_CLEAN_CHECKLIST)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isDayPassActive, setIsDayPassActive] = useState(false)
  const [dayPassExpiresAt, setDayPassExpiresAt] = useState<string | null>(null)
  const [isDayPassLoading, setIsDayPassLoading] = useState(false)
  const [defaultSenderName, setDefaultSenderName] = useState<string | null>(null)
  const [preferredPackage, setPreferredPackage] = useState<string | null>(null)
  const [savedCalculators, setSavedCalculators] = useState<SavedCalculator[]>([])
  const [showSaveCalculatorModal, setShowSaveCalculatorModal] = useState(false)
  const [newCalculatorName, setNewCalculatorName] = useState("")
  const [savingCalculator, setSavingCalculator] = useState(false)

  const searchParams = useSearchParams()
  const maxFreeQuotes = 3

  // Handle Day Pass success/cancel redirects
  useEffect(() => {
    const dpParam = searchParams.get("day_pass")
    if (dpParam === "success") {
      // Directly activate via the server — don't rely solely on webhook timing
      fetch("/api/day-pass/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
        .then(res => res.json())
        .then(result => {
          if (result.error) {
            console.error("[day-pass] activate error:", result.error)
            toast.error(`Day Pass error: ${result.error}`)
          } else {
            toast.success("Day Pass activated! You have unlimited quotes for the next 24 hours.")
          }
          // Refresh status from DB regardless
          return getSubscriptionAndDayPassStatus()
        })
        .then(({ isSubscribed, isDayPassActive, dayPassExpiresAt }) => {
          setIsSubscribed(isSubscribed)
          setIsDayPassActive(isDayPassActive)
          setDayPassExpiresAt(dayPassExpiresAt)
        })
        .catch(err => {
          console.error("[day-pass] activate fetch failed:", err)
          toast.error("Could not confirm Day Pass. Please refresh the page.")
        })
    } else if (dpParam === "cancelled") {
      toast.info("Day Pass purchase was cancelled.")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pre-fill form when navigating from "Load into Calculator" on the Quotes page
  useEffect(() => {
    const sqft = searchParams.get("sqft")
    const level = searchParams.get("level")
    const beds = searchParams.get("beds")
    const baths = searchParams.get("baths")
    const p = searchParams.get("pets")
    const ch = searchParams.get("children")
    if (sqft || level || beds || baths) {
      updateHomeDetails({
        ...(sqft ? { squareFootage: sqft } : {}),
        ...(level ? { cleanLevel: level } : {}),
        ...(beds ? { bedrooms: beds } : {}),
        ...(baths ? { bathrooms: baths } : {}),
        ...(p ? { pets: p } : {}),
        ...(ch ? { children: ch } : {}),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load default sender name on mount
  useEffect(() => {
    getDefaultSenderName().then(name => setDefaultSenderName(name))
  }, [])

  // Load saved calculators on mount
  useEffect(() => {
    getSavedCalculators().then(({ data }) => setSavedCalculators(data))
  }, [])

  // Load real subscription + day pass status from Supabase on mount
  useEffect(() => {
    getSubscriptionAndDayPassStatus().then(({ isSubscribed, isDayPassActive, dayPassExpiresAt }) => {
      setIsSubscribed(isSubscribed)
      setIsDayPassActive(isDayPassActive)
      setDayPassExpiresAt(dayPassExpiresAt)
    })
  }, [])

  // Track previous settings so we only recalculate on actual changes
  const prevSettingsRef = useRef(settings)

  useEffect(() => {
    if (!isLoaded) return
    const prev = prevSettingsRef.current
    const changed = JSON.stringify(prev) !== JSON.stringify(settings)
    prevSettingsRef.current = settings

    // Auto-recalculate only when settings change and form is complete
    if (changed && squareFootage && bedrooms && bathrooms) {
      runCalculation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, isLoaded])

  const SQ_FT_PER_SQ_M = 10.7639

  const toSqFt = (raw: string) => {
    const v = parseFloat(raw) || 0
    return sqftUnit === "sqm" ? v * SQ_FT_PER_SQ_M : v
  }

  const runCalculation = () => {
    const cleanLevelMinutes: Record<string, number> = { "1": 60, "2": 120, "3": 180 }

    const sqft = toSqFt(squareFootage)
    const beds = parseFloat(bedrooms) || 0
    const baths = parseFloat(bathrooms) || 0
    const numPets = parseFloat(pets) || 0
    const numChildren = parseFloat(children) || 0

    const totalMinutes =
      sqft * settings.sqftMultiplier +
      (cleanLevelMinutes[cleanLevel] || 120) +
      beds * settings.bedroomMinutes +
      baths * settings.bathroomMinutes +
      numPets * settings.petFeeMinutes +
      numChildren * settings.childrenFeeMinutes

    const totalHours = totalMinutes / 60
    const deepClean = Math.round(totalHours * settings.hourlyRate)
    const moveInMoveOut = Math.round((totalHours + 2) * settings.hourlyRate)
    const standardSingle = Math.round(deepClean * 0.80)
    const monthly = Math.round(standardSingle * 0.95)
    const biweekly = Math.round(standardSingle * 0.90)
    const weekly = Math.round(standardSingle * 0.85)

    updateQuoteResults({ deepClean, moveInMoveOut, standardSingle, monthly, biweekly, weekly, totalHours })
  }

  // User has unlimited access if subscribed OR has an active Day Pass
  const hasUnlimitedAccess = isSubscribed || isDayPassActive

  const executeCalculateQuote = async () => {
    setIsCalculating(true)
    await new Promise(resolve => setTimeout(resolve, 600))
    runCalculation()
    if (!hasUnlimitedAccess) {
      incrementQuotesUsed()
    }
    setIsCalculating(false)
    toast.success("Quote calculated successfully!")
  }

  const handleLoadCalculator = (calc: SavedCalculator) => {
    updateSettings(calc.settings)
    updateQuoteResults(null) // Clear results when loading new settings
    toast.success(`Loaded "${calc.name}" settings`)
  }

  const handleDeleteCalculator = async (calc: SavedCalculator) => {
    const { error } = await deleteCalculator(calc.id)
    if (error) {
      toast.error(error)
    } else {
      setSavedCalculators(prev => prev.filter(c => c.id !== calc.id))
      toast.success(`Deleted "${calc.name}"`)
    }
  }

  const [renamingCalcId, setRenamingCalcId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const handleRenameCalculator = async (calc: SavedCalculator) => {
    if (!renameValue.trim() || renameValue.trim() === calc.name) {
      setRenamingCalcId(null)
      return
    }
    const { error } = await renameCalculator(calc.id, renameValue.trim())
    if (error) {
      toast.error(error)
    } else {
      setSavedCalculators(prev => prev.map(c => c.id === calc.id ? { ...c, name: renameValue.trim() } : c))
      toast.success("Renamed successfully")
      setRenamingCalcId(null)
    }
  }

  const handleSaveCalculator = async () => {
    if (!newCalculatorName.trim()) {
      toast.error("Please enter a name")
      return
    }
    setSavingCalculator(true)
    const { data, error } = await saveCalculator(newCalculatorName.trim(), settings)
    setSavingCalculator(false)
    if (error) {
      toast.error(error)
    } else if (data) {
      setSavedCalculators(prev => {
        const exists = prev.find(c => c.id === data.id)
        if (exists) {
          return prev.map(c => c.id === data.id ? data : c)
        }
        return [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      })
      setShowSaveCalculatorModal(false)
      setNewCalculatorName("")
      toast.success(`Saved "${data.name}"`)
    }
  }

  const calculateQuote = async () => {
    if (!squareFootage || !bedrooms || !bathrooms) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!hasUnlimitedAccess && quotesUsed >= maxFreeQuotes) {
      // All free quotes exhausted — show paywall only (no "continue" option)
      setShowPaywall(true)
      return
    }

    if (!hasUnlimitedAccess && quotesUsed === maxFreeQuotes - 1) {
      // About to use the last free quote — show paywall with "continue" option
      setShowPaywall(true)
      return
    }

    // Quotes 1 & 2 — show standard credit confirmation
    if (!hasUnlimitedAccess) {
      setShowCreditConfirm(true)
      return
    }

    await executeCalculateQuote()
  }

  const handleSaveQuote = () => {
    setShowSaveModal(true)
  }

  const handleSaveQuoteSubmit = async (fields: SaveQuoteFields, saveAsDefault: boolean) => {
    if (!results) return
    // Combine address components into a formatted string
    // Combine address components into a formatted string
    const addressParts = [fields.streetAddress.trim()]
    if (fields.aptUnit.trim()) addressParts[0] += ` ${fields.aptUnit.trim()}`
    addressParts.push(`${fields.city.trim()}, ${fields.state.trim()} ${fields.zip.trim()}`)
    const fullAddress = addressParts.join(", ")
    
    // Combine first and last name
    const fullClientName = [fields.clientFirstName.trim(), fields.clientLastName.trim()].filter(Boolean).join(" ")
    
    const { error } = await saveQuote({
      quote_name: fields.name,
      home_address: fullAddress,
      notes: fields.notes || undefined,
      client_name: fullClientName || undefined,
      client_email: fields.clientEmail || undefined,
      client_phone: fields.clientPhone || undefined,
      quote_generated_by: fields.generatedBy || undefined,
      square_footage: sqftUnit === "sqm" ? String(Math.round(toSqFt(squareFootage))) : squareFootage,
      clean_level: cleanLevel,
      bedrooms,
      bathrooms,
      pets,
      children,
      hourly_rate: settings.hourlyRate,
      result_move_in: results.moveInMoveOut,
      result_deep_clean: results.deepClean,
      result_standard: results.standardSingle,
      result_monthly: results.monthly,
      result_biweekly: results.biweekly,
      result_weekly: results.weekly,
      settings_snapshot: settings,
      preferred_package: preferredPackage || undefined,
      checklist_data: {
        standard: customStandardClean,
        deep: customDeepClean,
        move: customMoveIn,
      },
    })
    if (error) {
      console.error("[saveQuote]", error)
      toast.error(error)
    } else {
      if (saveAsDefault && fields.generatedBy.trim()) {
        await setDefaultSenderName(fields.generatedBy.trim())
        setDefaultSenderName(fields.generatedBy.trim())
      }
      setShowSaveModal(false)
      toast.success("Quote saved")
    }
  }

  const getSendQuoteData = (): SendQuoteData | null => {
    if (!results) return null
    return {
      quoteName: "Quick Quote",
      homeAddress: squareFootage ? `${squareFootage} ${sqftUnit === "sqft" ? "sq ft" : "m²"} home` : "Your Home",
      clientName: null,
      clientEmail: null,
      clientPhone: null,
      generatedBy: defaultSenderName,
      notes: null,
      resultStandard: results.standardSingle,
      resultDeepClean: results.deepClean,
      resultMoveIn: results.moveInMoveOut,
      resultMonthly: results.monthly,
      resultBiweekly: results.biweekly,
      resultWeekly: results.weekly,
    }
  }

  const handleSendQuote = () => {
    if (!hasUnlimitedAccess) { setShowPaywall(true); return }
    setShowSendModal(true)
  }

  const handleExportPdf = async () => {
    if (!hasUnlimitedAccess) { setShowPaywall(true); return }
    const data = getSendQuoteData()
    if (!data) return
    await exportQuotePdf(data)
  }

  // Compute base labor hours from current form inputs — used by every tooltip
  const baseLaborHours = (() => {
    const cleanLevelMinutes: Record<string, number> = { "1": 60, "2": 120, "3": 180 }
    const sqft = toSqFt(squareFootage)
    const beds = parseFloat(bedrooms) || 0
    const baths = parseFloat(bathrooms) || 0
    const numPets = parseFloat(pets) || 0
    const numChildren = parseFloat(children) || 0
    const totalMinutes =
      sqft * settings.sqftMultiplier +
      (cleanLevelMinutes[cleanLevel] || 120) +
      beds * settings.bedroomMinutes +
      baths * settings.bathroomMinutes +
      numPets * settings.petFeeMinutes +
      numChildren * settings.childrenFeeMinutes
    return totalMinutes / 60
  })()

  const oneTimeCleans = results ? [
    { key: "move", label: "Move In / Move Out", subtitle: "Extra time for vacant properties", price: results.moveInMoveOut, hours: results.totalHours + 2, clickable: true },
    { key: "deep", label: "Deep Clean", subtitle: "One-time thorough cleaning", price: results.deepClean, hours: results.totalHours, clickable: true },
    { key: "standard", label: "Single", subtitle: "One-time regular cleaning", price: results.standardSingle, hours: results.totalHours * 0.85, clickable: true },
  ] : []

  const recurringCleans = results ? [
    { key: "monthly", label: "Monthly", subtitle: "Once a month service", price: results.monthly, hours: results.totalHours * 0.85 },
    { key: "biweekly", label: "Bi-weekly", subtitle: "Every two weeks service", price: results.biweekly, hours: results.totalHours * 0.8 },
    { key: "weekly", label: "Weekly", subtitle: "Weekly recurring service", price: results.weekly, hours: results.totalHours * 0.75 },
  ] : []

  const priceCards = [...oneTimeCleans, ...recurringCleans]

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:ml-64">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Cleaning Quote Calculator</h1>
          <p className="mt-1 text-muted-foreground">
            Enter the home details to generate accurate pricing
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {/* Calculator Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Home Details
              </CardTitle>
              <CardDescription>
                Fill in the details below to calculate your quote
              </CardDescription>
              {/* Saved Calculators Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-3 w-fit gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Access Saved Calculators
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {savedCalculators.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      <p>No saved calculators yet.</p>
                      <p className="mt-1 text-xs">Save your current settings below.</p>
                    </div>
                  ) : (
                    savedCalculators.map(calc => (
                      <div key={calc.id} className="px-1 py-0.5">
                        {renamingCalcId === calc.id ? (
                          /* Inline rename row */
                          <div className="flex items-center gap-1.5 px-2 py-1.5" onClick={e => e.stopPropagation()}>
                            <input
                              autoFocus
                              className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") handleRenameCalculator(calc)
                                if (e.key === "Escape") setRenamingCalcId(null)
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRenameCalculator(calc)}
                              className="rounded px-2 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingCalcId(null)}
                              className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          /* Normal row */
                          <div className="flex items-center justify-between gap-1 rounded-sm hover:bg-accent">
                            <button
                              type="button"
                              onClick={() => handleLoadCalculator(calc)}
                              className="flex-1 px-2 py-1.5 text-left"
                            >
                              <p className="text-sm font-medium">{calc.name}</p>
                              <p className="text-xs text-muted-foreground">${calc.settings.hourlyRate}/hr</p>
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  onClick={e => e.stopPropagation()}
                                  className="mr-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation()
                                    setRenameValue(calc.name)
                                    setRenamingCalcId(calc.id)
                                  }}
                                  className="gap-2"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation()
                                    handleDeleteCalculator(calc)
                                  }}
                                  className="gap-2 text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setNewCalculatorName("")
                      setShowSaveCalculatorModal(true)
                    }}
                    className="gap-2"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    Save Current Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sqft">{sqftUnit === "sqft" ? "Square Footage" : "Square Meters"} *</Label>
                  <div className="flex rounded-md border border-border overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setSqftUnit("sqft")}
                      className={cn("px-2.5 py-1 font-medium transition-colors", sqftUnit === "sqft" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted")}
                    >sq ft</button>
                    <button
                      type="button"
                      onClick={() => setSqftUnit("sqm")}
                      className={cn("px-2.5 py-1 font-medium transition-colors border-l border-border", sqftUnit === "sqm" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted")}
                    >m²</button>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id="sqft"
                    type="number"
                    placeholder={sqftUnit === "sqft" ? "e.g., 2000" : "e.g., 185"}
                    value={squareFootage}
                    onChange={(e) => setSquareFootage(e.target.value)}
                    className="pr-14"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {sqftUnit === "sqft" ? "sq ft" : "m²"}
                  </span>
                </div>
                {sqftUnit === "sqm" && (
                  <p className="text-xs text-muted-foreground">Metric entries are converted automatically for pricing.</p>
                )}
              </div>

              <div className="space-y-3 py-1 sm:col-span-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Clean Level *</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Select the scope of cleaning based on the home&apos;s current condition or expected ongoing condition.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    { value: "1", label: "Light Clean", sub: "Basic upkeep cleaning" },
                    { value: "2", label: "Medium Clean", sub: "Thorough scrub-down" },
                    { value: "3", label: "Heavy Clean", sub: "Full top-to-bottom clean" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCleanLevel(option.value)}
                      className={cn(
                        "rounded-lg border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        cleanLevel === option.value
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    placeholder="e.g., 3"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    placeholder="e.g., 2"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pets">Pets</Label>
                  <Input
                    id="pets"
                    type="number"
                    placeholder="0"
                    value={pets}
                    onChange={(e) => setPets(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children">Children</Label>
                  <Input
                    id="children"
                    type="number"
                    placeholder="0"
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium">${settings.hourlyRate}/hr</span>
                </div>

                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="mb-2 text-xs font-medium text-foreground">Active Custom Settings</p>
                  {(() => {
                    const changes: { label: string; value: string }[] = []

                    if (settings.bedroomMinutes !== defaultSettings.bedroomMinutes) {
                      const diff = settings.bedroomMinutes - defaultSettings.bedroomMinutes
                      changes.push({ label: "Bedroom Minutes", value: `${settings.bedroomMinutes} (${diff >= 0 ? '+' : ''}${diff})` })
                    }
                    if (settings.bathroomMinutes !== defaultSettings.bathroomMinutes) {
                      const diff = settings.bathroomMinutes - defaultSettings.bathroomMinutes
                      changes.push({ label: "Bathroom Minutes", value: `${settings.bathroomMinutes} (${diff >= 0 ? '+' : ''}${diff})` })
                    }
                    if (settings.petFeeMinutes !== defaultSettings.petFeeMinutes) {
                      const diff = settings.petFeeMinutes - defaultSettings.petFeeMinutes
                      changes.push({ label: "Pet Fee Minutes", value: `${settings.petFeeMinutes} (${diff >= 0 ? '+' : ''}${diff})` })
                    }
                    if (settings.childrenFeeMinutes !== defaultSettings.childrenFeeMinutes) {
                      const diff = settings.childrenFeeMinutes - defaultSettings.childrenFeeMinutes
                      changes.push({ label: "Children Fee Minutes", value: `${settings.childrenFeeMinutes} (${diff >= 0 ? '+' : ''}${diff})` })
                    }
                    if (settings.sqftMultiplier !== defaultSettings.sqftMultiplier) {
                      changes.push({ label: "Sqft Multiplier", value: `${settings.sqftMultiplier}` })
                    }
                    if (settings.moveInExtraHours !== defaultSettings.moveInExtraHours) {
                      changes.push({ label: "Move-In Extra Hours", value: `${settings.moveInExtraHours}` })
                    }
                    if (settings.standardCleanDiscount !== defaultSettings.standardCleanDiscount) {
                      changes.push({ label: "Standard Discount", value: `${settings.standardCleanDiscount}%` })
                    }
                    if (settings.monthlyDiscount !== defaultSettings.monthlyDiscount) {
                      changes.push({ label: "Monthly Discount", value: `${settings.monthlyDiscount}%` })
                    }
                    if (settings.biweeklyDiscount !== defaultSettings.biweeklyDiscount) {
                      changes.push({ label: "Biweekly Discount", value: `${settings.biweeklyDiscount}%` })
                    }
                    if (settings.weeklyDiscount !== defaultSettings.weeklyDiscount) {
                      changes.push({ label: "Weekly Discount", value: `${settings.weeklyDiscount}%` })
                    }
                    if (settings.minimumQuotePrice !== defaultSettings.minimumQuotePrice) {
                      changes.push({ label: "Minimum Quote", value: `$${settings.minimumQuotePrice}` })
                    }
                    if (settings.travelFee !== defaultSettings.travelFee) {
                      changes.push({ label: "Travel Fee", value: `$${settings.travelFee}` })
                    }
                    if (settings.hourlyRate !== defaultSettings.hourlyRate) {
                      const diff = settings.hourlyRate - defaultSettings.hourlyRate
                      changes.push({ label: "Hourly Rate", value: `$${settings.hourlyRate} (${diff >= 0 ? '+' : ''}$${diff})` })
                    }

                    if (changes.length === 0) {
                      return <p className="text-xs text-muted-foreground">Using Default Pricing Settings</p>
                    }

                    return (
                      <ul className="space-y-1">
                        {changes.map((change, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="text-muted-foreground">{change.label}:</span>
                            <span className="font-medium text-foreground">{change.value}</span>
                          </li>
                        ))}
                      </ul>
                    )
                  })()}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Link
                    href="/dashboard/settings"
                    className="text-xs text-primary hover:underline"
                  >
                    Edit Pricing Settings
                  </Link>
                  {(() => {
                    const hasChanges = Object.keys(defaultSettings).some(
                      (key) => settings[key as keyof typeof settings] !== defaultSettings[key as keyof typeof defaultSettings]
                    )
                    if (!hasChanges) return null
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          resetToDefaults()
                          updateQuoteResults(null)
                          toast.success("Pricing settings reset")
                        }}
                        className="text-xs text-destructive/80 hover:text-destructive hover:underline"
                      >
                        Clear Active Pricing Settings
                      </button>
                    )
                  })()}
                </div>
              </div>

              <Button
                onClick={calculateQuote}
                className="w-full"
                size="lg"
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <>Calculating...</>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Generate Quote
                  </>
                )}
              </Button>

              {isDayPassActive && dayPassExpiresAt ? (
                <DayPassCountdown expiresAt={dayPassExpiresAt} />
              ) : !isSubscribed && (
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Free Plan: {Math.max(0, maxFreeQuotes - quotesUsed)} of {maxFreeQuotes} quotes remaining
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {results ? (
              <>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Your Quote</h2>
                
                {/* One-Time Clean */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.72 0.15 80)" }}>One-Time Clean</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {oneTimeCleans.map((card) => {
                      const cardKey = card.key
                      const isPreferred = preferredPackage === cardKey
                      return (
                        <Card
                          key={cardKey}
                          onClick={
                            card.label === "Deep Clean" ? () => setShowDeepClean(true)
                            : card.label === "Move In / Move Out" ? () => setShowMoveIn(true)
                            : card.label === "Single" ? () => setShowStandardClean(true)
                            : undefined
                          }
                          className={`relative transition-all hover:shadow-md ${
                            card.clickable ? "cursor-pointer hover:border-primary/50 hover:bg-accent/30" : ""
                          } ${isPreferred ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card"}`}
                        >
                          {isPreferred && (
                            <Badge variant="outline" className="absolute -top-2 left-4 gap-1 border-primary bg-background text-primary">
                              Selected
                            </Badge>
                          )}
                          <CardContent className="flex min-h-28 items-center justify-between gap-4 p-5">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isPreferred}
                                onCheckedChange={() => setPreferredPackage(isPreferred ? null : cardKey)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-5 w-5"
                              />
                              <div>
                                <p className={`text-base font-semibold ${isPreferred ? "text-primary-foreground" : "text-foreground"}`}>{card.label}</p>
                                <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button type="button" className={`flex items-center gap-1 text-sm mt-0.5 ${isPreferred ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                        <span>{card.subtitle}</span>
                                        <Info className="h-3 w-3 shrink-0 text-primary" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" showArrow={false} className="bg-white text-foreground border border-border shadow-md rounded-lg px-2.5 py-1.5 space-y-0.5 text-[11px]">
                                      <p className="font-bold text-foreground">Estimated Labor Time</p>
                                      <p className="text-foreground"><span className="font-bold">1 Cleaner:</span> {formatHours(card.hours)}</p>
                                      <p className="text-foreground"><span className="font-bold">2 Cleaners:</span> {formatHours(card.hours / 2)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            <p className={`shrink-0 text-3xl font-bold ${isPreferred ? "text-primary-foreground" : "text-foreground"}`}>${card.price}</p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* Recurring Clean */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.72 0.15 80)" }}>Recurring Clean</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {recurringCleans.map((card) => {
                      const cardKey = card.key
                      const isPreferred = preferredPackage === cardKey
                      return (
                        <Card
                          key={cardKey}
                          className={`relative transition-all hover:shadow-md ${isPreferred ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card"}`}
                        >
                          {isPreferred && (
                            <Badge variant="outline" className="absolute -top-2 left-4 gap-1 border-primary bg-background text-primary">
                              Selected
                            </Badge>
                          )}
                          <CardContent className="flex min-h-28 items-center justify-between gap-4 p-5">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isPreferred}
                                onCheckedChange={() => setPreferredPackage(isPreferred ? null : cardKey)}
                                className="h-5 w-5"
                              />
                              <div>
                                <p className={`text-base font-semibold ${isPreferred ? "text-primary-foreground" : "text-foreground"}`}>{card.label}</p>
                                <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button type="button" className={`flex items-center gap-1 text-sm mt-0.5 ${isPreferred ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                        <span>{card.subtitle}</span>
                                        <Info className="h-3 w-3 shrink-0 text-primary" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" showArrow={false} className="bg-white text-foreground border border-border shadow-md rounded-lg px-2.5 py-1.5 space-y-0.5 text-[11px]">
                                      <p className="font-bold text-foreground">Estimated Labor Time</p>
                                      <p className="text-foreground"><span className="font-bold">1 Cleaner:</span> {formatHours(card.hours)}</p>
                                      <p className="text-foreground"><span className="font-bold">2 Cleaners:</span> {formatHours(card.hours / 2)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            <p className={`shrink-0 text-3xl font-bold ${isPreferred ? "text-primary-foreground" : "text-foreground"}`}>${card.price}</p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={handleSaveQuote} variant="outline" className="w-full">
                    <Bookmark className="mr-2 h-4 w-4" />Save Quote
                  </Button>
                  <div className="flex gap-2">
                    <Button onClick={handleSendQuote} variant="outline" className="flex-1">
                      {hasUnlimitedAccess ? (
                        <><Send className="mr-2 h-4 w-4" />Send Quote</>
                      ) : (
                        <><Lock className="mr-2 h-4 w-4" />Send Quote (Pro)</>
                      )}
                    </Button>
                    <Button onClick={handleExportPdf} variant="outline" className="flex-1">
                      {hasUnlimitedAccess ? (
                        <><FileDown className="mr-2 h-4 w-4" />Export PDF</>
                      ) : (
                        <><Lock className="mr-2 h-4 w-4" />Export PDF (Pro)</>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Card className="flex h-full min-h-[300px] items-center justify-center border-dashed">
                <CardContent className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Calculator className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-muted-foreground">No quote yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fill in the form and click Generate Quote
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <ChecklistModal
        open={showDeepClean}
        onClose={() => setShowDeepClean(false)}
        title="Deep Clean Checklist"
        description="Everything included in a deep clean service"
        checklist={customDeepClean}
        onSave={(updated) => {
          setCustomDeepClean(updated)
          toast.success("Deep clean checklist updated")
        }}
      />
      <ChecklistModal
        open={showMoveIn}
        onClose={() => setShowMoveIn(false)}
        title="Move In / Move Out Checklist"
        description="Everything included in a move in or move out clean"
        checklist={customMoveIn}
        onSave={(updated) => {
          setCustomMoveIn(updated)
          toast.success("Move in/out checklist updated")
        }}
      />
      <ChecklistModal
        open={showStandardClean}
        onClose={() => setShowStandardClean(false)}
        title="Standard Cleaning Checklist"
        description="Everything included in a standard cleaning"
        checklist={customStandardClean}
        onSave={(updated) => {
          setCustomStandardClean(updated)
          toast.success("Standard clean checklist updated")
        }}
      />

      <SaveQuoteModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveQuoteSubmit}
        defaultSenderName={defaultSenderName}
      />

      <SendQuoteModal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        data={getSendQuoteData()}
      />

      {/* Paywall Modal */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>Need more quotes today?</DialogTitle>
            <DialogDescription>
              {quotesUsed === maxFreeQuotes - 1
                ? "This is your last free quote for the week. You can continue with Free Quote 3 of 3, unlock unlimited quotes for the next 24 hours with a Day Pass, or upgrade to Pro."
                : "You\u2019ve used all your free quotes for this week. Unlock unlimited quotes for the next 24 hours with a Day Pass, or upgrade to Pro."}
            </DialogDescription>
          </DialogHeader>

          {/* Day Pass option */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Day Pass</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Unlimited quotes for the next 24 hours</p>
              </div>
              <span className="shrink-0 text-base font-bold text-foreground">$3</span>
            </div>
            <Button
              className="mt-3 w-full"
              disabled={isDayPassLoading}
              onClick={async () => {
                setIsDayPassLoading(true)
                try {
                  const { url } = await createDayPassCheckoutSession()
                  window.location.href = url
                } catch {
                  toast.error("Could not start checkout. Please try again.")
                  setIsDayPassLoading(false)
                }
              }}
            >
              {isDayPassLoading ? "Redirecting..." : "Unlock Day Pass — $3"}
            </Button>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button asChild variant="outline" className="w-full">
              <Link href="/pricing">Upgrade to Pro</Link>
            </Button>
            {quotesUsed === maxFreeQuotes - 1 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowPaywall(false)
                  executeCalculateQuote()
                }}
              >
                Continue with Free Quote {maxFreeQuotes} of {maxFreeQuotes}
              </Button>
            )}
            <Button variant="ghost" className="w-full" onClick={() => setShowPaywall(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Free quote credit confirmation */}
      <AlertDialog open={showCreditConfirm} onOpenChange={setShowCreditConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use Free Quote {quotesUsed + 1} of {maxFreeQuotes}?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to use free quote {quotesUsed + 1} of {maxFreeQuotes} for this week. Make sure your estimate details look correct before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setShowCreditConfirm(false)
                executeCalculateQuote()
              }}
            >
              Yes, Generate Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Calculator Modal */}
      <Dialog open={showSaveCalculatorModal} onOpenChange={setShowSaveCalculatorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkPlus className="h-5 w-5 text-primary" />
              Save Calculator Settings
            </DialogTitle>
            <DialogDescription>
              Give your calculator settings a name to save and reuse later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="calc-name">Calculator Name</Label>
              <Input
                id="calc-name"
                placeholder="e.g., Standard Rates, Premium Pricing"
                value={newCalculatorName}
                onChange={e => setNewCalculatorName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveCalculator()}
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium text-foreground">Current Settings Preview</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                <span>Hourly Rate:</span>
                <span className="text-foreground">${settings.hourlyRate}/hr</span>
                <span>Minimum Price:</span>
                <span className="text-foreground">${settings.minimumQuotePrice}</span>
                <span>Travel Fee:</span>
                <span className="text-foreground">${settings.travelFee}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveCalculatorModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCalculator} disabled={savingCalculator || !newCalculatorName.trim()}>
              {savingCalculator ? "Saving..." : "Save Calculator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
