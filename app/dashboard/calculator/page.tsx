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
import { DashboardNav } from "@/components/dashboard-nav"
import { usePricingSettings, defaultSettings } from "@/contexts/pricing-settings-context"
import { Calculator, Sparkles, Lock, Info, Check, Bookmark, Send, FileDown, Pencil, Trash2, Plus, FolderOpen, ChevronDown, BookmarkPlus, MoreHorizontal } from "lucide-react"
import { getSavedCalculators, getCalculatorFolders, createCalculatorFolder, updateCalculatorFolder, moveCalculator, saveCalculator, deleteCalculator, renameCalculator, type SavedCalculator, type CalculatorFolder } from "@/app/actions/calculators"
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
import { AIQuoteReview } from "@/components/ai-quote-review"

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
                    onSelectParts={(parts) => {
                      setFields(prev => ({
                        ...prev,
                        streetAddress: parts.street,
                        city: parts.city,
                        state: parts.state,
                        zip: parts.zip,
                      }))
                      setReviewCity(parts.city)
                      setReviewZip(parts.zip)
                    }}
                    placeholder="Street Address"
                    required
                  />
                  <Input id="sq-apt" placeholder="Apt, Suite, Unit (optional)" value={fields.aptUnit} onChange={set("aptUnit")} />
                  <div className="grid grid-cols-6 gap-2">
                    <Input id="sq-city" placeholder="City" value={fields.city} onChange={e => { set("city")(e); setReviewCity(e.target.value) }} required className="col-span-3" />
                    <Input id="sq-state" placeholder="State" value={fields.state} onChange={set("state")} required className="col-span-1" />
                    <Input id="sq-zip" placeholder="ZIP" value={fields.zip} onChange={e => { set("zip")(e); setReviewZip(e.target.value) }} required className="col-span-2" />
                  </div>
                </div>

                {/* Recurring Clean */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.72 0.15 80)" }}>Recurring Clean</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {recurringCleans.map((card) => {
                      const cardKey = card.key
                      const isPreferred = preferredPackage === cardKey
                      return (
                        <Card
                          key={cardKey}
                          onClick={() => setPreferredPackage(isPreferred ? null : cardKey)}
                          className={`relative cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${isPreferred ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card"}`}
                        >
                          {isPreferred && (
                            <Badge variant="outline" className="absolute -top-2 left-4 gap-1 border-primary bg-background text-primary">
                              Selected
                            </Badge>
                          )}
                          <CardContent className="grid min-h-28 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 p-5 sm:min-h-32 sm:p-6">
                            <div className="flex min-w-0 h-full flex-col">
                              <p className={`text-base font-semibold leading-tight sm:text-lg ${isPreferred ? "text-primary-foreground" : "text-foreground"}`}>{card.label}</p>
                                <p className={`mt-2 flex max-w-52 items-start gap-1 text-sm leading-5 ${isPreferred ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                  <span>{card.subtitle}</span>
                                </p>
                                <div className={`mt-auto pt-5 flex flex-wrap gap-x-3 gap-y-1 text-xs ${isPreferred ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                  <span>1 cleaner: {formatHours(card.hours)}</span>
                                  <span>2 cleaners: {formatHours(card.hours / 2)}</span>
                                </div>
                              </div>
                            <p className={`self-center text-3xl font-bold tracking-tight sm:text-4xl ${isPreferred ? "text-primary-foreground" : "text-foreground"}`}>${card.price}</p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Cleaning Checklist</h3>
                      <p className="text-sm text-muted-foreground">Review and customize what&apos;s included in your cleaning service.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (preferredPackage === "deep") setShowDeepClean(true)
                        else if (preferredPackage === "move") setShowMoveIn(true)
                        else setShowStandardClean(true)
                      }}
                    >
                      Open Checklist
                    </Button>
                  </CardContent>
                </Card>

                {preferredPackage && results && (
                  <AIQuoteReview
                    key={`${preferredPackage}-${toSqFt(squareFootage)}-${bedrooms}-${bathrooms}-${cleanLevel}-${pets}-${children}-${reviewCity}-${reviewZip}-${priceCards.find((card) => card.key === preferredPackage)?.price ?? 0}`}
                    quote={{
                      squareFootage: toSqFt(squareFootage),
                      bedrooms: Number(bedrooms) || 0,
  bathrooms: Number(bathrooms) || 0,
  city: reviewCity,
  zip: reviewZip,
  serviceType: preferredPackage,
                      cleaningLevel: cleanLevelLabel,
                      recurringFrequency: preferredPackage.startsWith("monthly") ? "Monthly" : preferredPackage.startsWith("biweekly") ? "Bi-weekly" : preferredPackage.startsWith("weekly") ? "Weekly" : "One-time",
                      pets: Number(pets) || 0,
                      addOns: [],
                      estimatedHours: priceCards.find((card) => card.key === preferredPackage)?.hours ?? results.totalHours,
                      notes: "",
                      checklist: { standard: customStandardClean, deep: customDeepClean, move: customMoveIn },
                      totalPrice: priceCards.find((card) => card.key === preferredPackage)?.price ?? 0,
                    }}
                  />
                )}

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
            </div>
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
              <div className="space-y-2">
                <Label htmlFor="save-folder">Folder</Label>
                <select id="save-folder" value={saveFolderId} onChange={e => setSaveFolderId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Unfiled</option>
                  {calculatorFolders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Create new folder" className="h-9" />
                  <input type="color" value={newFolderColor} onChange={e => setNewFolderColor(e.target.value)} className="h-9 w-10 rounded border border-input bg-background p-1" aria-label="New folder color" />
                  <Button type="button" variant="outline" size="sm" onClick={async () => { await handleCreateFolder(); }} disabled={!newFolderName.trim()}>Create</Button>
                </div>
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

      <div className={cn("fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-stretch transition-transform", bookmarksOpen ? "translate-x-0" : "translate-x-[calc(100%-2.75rem)]")}>
        <button type="button" onClick={() => setBookmarksOpen(prev => !prev)} className="flex w-11 flex-col items-center justify-center gap-2 rounded-l-xl bg-primary py-5 text-primary-foreground shadow-lg" aria-label="Toggle saved calculators">
          <Bookmark className="h-5 w-5" />
          <span className="[writing-mode:vertical-rl] text-xs font-semibold">Saved</span>
        </button>
        <aside className="w-80 max-w-[calc(100vw-2.75rem)] border border-border bg-background p-4 shadow-xl" aria-label="Saved calculators">
          <div className="mb-4 flex gap-2">
            <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreateFolder()} placeholder="New folder" className="h-9" />
            <input type="color" value={newFolderColor} onChange={e => setNewFolderColor(e.target.value)} className="h-9 w-9 rounded border border-input bg-background p-1" aria-label="Folder color" />
            <Button size="icon" onClick={handleCreateFolder} aria-label="Create folder"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center justify-between">
            <div><h2 className="font-semibold">Saved Calculators</h2><p className="text-xs text-muted-foreground">Organize your pricing settings</p></div>
            <Button variant="ghost" size="icon" onClick={() => setBookmarksOpen(false)} aria-label="Close saved calculators"><ChevronDown className="h-4 w-4 rotate-90" /></Button>
          </div>
          <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto">
            {calculatorFolders.map(folder => (
              <section key={folder.id}>
  <div className="flex items-center gap-2">
  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: folder.color }} />
  {editingFolderId === folder.id ? <>
    <Input autoFocus defaultValue={folder.name} onBlur={async e => { const name = e.target.value.trim(); if (name && name !== folder.name) { const result = await updateCalculatorFolder(folder.id, { name }); if (result.error) toast.error(result.error); else setCalculatorFolders(prev => prev.map(item => item.id === folder.id ? { ...item, name } : item).sort((a, b) => a.name.localeCompare(b.name))) } setEditingFolderId(null) }} className="h-8 min-w-0 flex-1" aria-label={`Rename ${folder.name}`} />
    <input type="color" value={folder.color} onChange={async e => { const color = e.target.value; setCalculatorFolders(prev => prev.map(item => item.id === folder.id ? { ...item, color } : item)); const result = await updateCalculatorFolder(folder.id, { color }); if (result.error) toast.error(result.error) }} className="h-7 w-7 shrink-0 rounded border border-input bg-background p-0.5" aria-label={`Recolor ${folder.name}`} />
  </> : <>
    <h3 className="min-w-0 flex-1 truncate text-sm font-medium">{folder.name}</h3>
    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingFolderId(folder.id)} aria-label={`Edit ${folder.name}`}><Pencil className="h-3.5 w-3.5" /></Button>
  </>}
  </div>
                <div className="mt-1 space-y-1 pl-5">{savedCalculators.filter(calc => calc.folder_id === folder.id).map(calc => <div key={calc.id} className="flex items-center gap-1">{renamingCalcId === calc.id ? <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1"><Input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleRenameCalculator(calc); if (e.key === "Escape") setRenamingCalcId(null) }} className="h-8 min-w-24 flex-1" aria-label={`Rename ${calc.name}`} /><select value={calc.folder_id ?? ""} onChange={e => handleMoveCalculator(calc, e.target.value || null)} className="h-8 max-w-28 rounded-md border border-input bg-background px-1 text-xs" aria-label={`Move ${calc.name}`}><option value="">Unfiled</option>{calculatorFolders.map(target => <option key={target.id} value={target.id}>{target.name}</option>)}</select><Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs" disabled={!newFolderName.trim()} onClick={async () => { const created = await handleCreateFolder(); if (created) await handleMoveCalculator(calc, created.id) }}>New folder</Button></div> : <button type="button" onClick={() => handleLoadCalculator(calc)} className="min-w-0 flex-1 truncate rounded px-2 py-1.5 text-left text-sm hover:bg-accent">{calc.name}</button>}<div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setRenameValue(calc.name); setNewFolderName(""); setRenamingCalcId(renamingCalcId === calc.id ? null : calc.id) }} aria-label={`Edit ${calc.name}`}><Pencil className="h-3.5 w-3.5" /></Button>{renamingCalcId === calc.id && <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => handleDeleteCalculator(calc)} aria-label={`Delete ${calc.name}`}><Trash2 className="h-3.5 w-3.5" /></Button>}</div></div>)}</div>
              </section>
            ))}
            <section><h3 className="text-sm font-medium">Unfiled</h3><div className="mt-1 space-y-1">{savedCalculators.filter(calc => !calc.folder_id).map(calc => <div key={calc.id} className="flex items-center gap-1">{renamingCalcId === calc.id ? <Input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleRenameCalculator(calc); if (e.key === "Escape") setRenamingCalcId(null) }} className="h-8 min-w-0 flex-1" aria-label={`Rename ${calc.name}`} /> : <button type="button" onClick={() => handleLoadCalculator(calc)} className="min-w-0 flex-1 truncate rounded px-2 py-1.5 text-left text-sm hover:bg-accent">{calc.name}</button>}<Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setRenameValue(calc.name); setRenamingCalcId(calc.id) }} aria-label={`Edit ${calc.name}`}><Pencil className="h-3.5 w-3.5" /></Button><select value={calc.folder_id ?? ""} onChange={e => handleMoveCalculator(calc, e.target.value || null)} className="w-6 bg-transparent text-xs" aria-label={`Move ${calc.name}`}><option value="">•</option>{calculatorFolders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></div>)}</div></section>
            {!savedCalculators.length && <p className="py-5 text-center text-sm text-muted-foreground">No saved calculators yet.</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}
