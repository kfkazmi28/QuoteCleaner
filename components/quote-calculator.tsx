"use client"

import { useState } from "react"
import { Star, RotateCcw, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaywallModal } from "@/components/paywall-modal"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AIQuoteReview } from "@/components/ai-quote-review"

interface FormState {
  squareFootage: string
  cleanLevel: "1" | "2" | "3"
  bedrooms: string
  bathrooms: string
  pets: string
  children: string
  hourlyRate: string
}

interface QuoteResult {
  deepClean: number
  moveInMoveOut: number
  standardSingle: number
  monthly: number
  biweekly: number
  weekly: number
  totalHours: number
}

const CLEAN_LEVEL_MINUTES: Record<string, number> = { "1": 60, "2": 120, "3": 180 }

function calculateQuote(form: FormState): QuoteResult {
  const sqft = parseFloat(form.squareFootage) || 0
  const rate = parseFloat(form.hourlyRate) || 40
  const beds = parseFloat(form.bedrooms) || 0
  const baths = parseFloat(form.bathrooms) || 0
  const pets = parseFloat(form.pets) || 0
  const kids = parseFloat(form.children) || 0

  const totalMinutes =
    sqft * 0.125 +
    CLEAN_LEVEL_MINUTES[form.cleanLevel] +
    beds * 10 +
    baths * 15 +
    pets * 15 +
    kids * 15

  const totalHours = totalMinutes / 60
  const deepClean = totalHours * rate
  const moveInMoveOut = (totalHours + 2) * rate
  const standardSingle = deepClean * 0.80
  const monthly = standardSingle * 0.95
  const biweekly = standardSingle * 0.90
  const weekly = standardSingle * 0.85

  return {
    deepClean: Math.round(deepClean),
    moveInMoveOut: Math.round(moveInMoveOut),
    standardSingle: Math.round(standardSingle),
    monthly: Math.round(monthly),
    biweekly: Math.round(biweekly),
    weekly: Math.round(weekly),
    totalHours,
  }
}

const RESULT_LABELS: { key: keyof Omit<QuoteResult, "totalHours">; label: string; subtitle: string; recommended?: boolean; hoursMultiplier: number }[] = [
  { key: "deepClean", label: "Deep Clean", subtitle: "One-time thorough cleaning", hoursMultiplier: 1 },
  { key: "moveInMoveOut", label: "Move In / Move Out", subtitle: "Extra time for vacant properties", hoursMultiplier: 1 },
  { key: "standardSingle", label: "Standard Single", subtitle: "One-time regular cleaning", hoursMultiplier: 0.85 },
  { key: "monthly", label: "Monthly Recurring", subtitle: "Once a month service", hoursMultiplier: 0.85 },
  { key: "biweekly", label: "Biweekly Recurring", subtitle: "Every two weeks service", recommended: true, hoursMultiplier: 0.80 },
  { key: "weekly", label: "Weekly Recurring", subtitle: "Weekly recurring service", hoursMultiplier: 0.75 },
]

function roundToQuarter(h: number) {
  return Math.round(h * 4) / 4
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

const DEFAULT_FORM: FormState = {
  squareFootage: "",
  cleanLevel: "1",
  bedrooms: "",
  bathrooms: "",
  pets: "",
  children: "",
  hourlyRate: "40",
}

// Public calculator — no auth gating; gating lives in the dashboard
const IS_SUBSCRIBED = false

const SQ_FT_PER_SQ_M = 10.7639

export function QuoteCalculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [result, setResult] = useState<QuoteResult | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [sqftUnit, setSqftUnit] = useState<"sqft" | "sqm">("sqft")
  const [selectedTier, setSelectedTier] = useState<keyof Omit<QuoteResult, "totalHours">>("biweekly")
  const { toast } = useToast()

  const setField = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleGenerate = () => {
    if (!form.squareFootage) {
      toast({ title: sqftUnit === "sqft" ? "Square footage required" : "Square meters required", description: "Please enter the home size.", variant: "destructive" })
      return
    }

    const sqftValue = sqftUnit === "sqm"
      ? String(parseFloat(form.squareFootage) * SQ_FT_PER_SQ_M)
      : form.squareFootage

    setResult(calculateQuote({ ...form, squareFootage: sqftValue }))
  }

  const handleReset = () => {
    setForm(DEFAULT_FORM)
    setResult(null)
    setSelectedTier("biweekly")
  }


  return (
    <>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h1 className="text-xl font-bold text-card-foreground">Cleaning Quote Calculator</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Fill in the details below to generate your pricing tiers instantly.
            </p>
          </div>

          <div className="px-6 py-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Square Footage / Square Meters */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="sqft">{sqftUnit === "sqft" ? "Square Footage" : "Square Meters"}</Label>
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
                    min={0}
                    placeholder={sqftUnit === "sqft" ? "e.g. 1500" : "e.g. 140"}
                    value={form.squareFootage}
                    onChange={(e) => setField("squareFootage", e.target.value)}
                    className="pr-14"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {sqftUnit === "sqft" ? "sq ft" : "m²"}
                  </span>
                </div>
                {sqftUnit === "sqm" && (
                  <p className="mt-1 text-xs text-muted-foreground">Metric entries are converted automatically for pricing.</p>
                )}
              </div>

              {/* Clean Level */}
              <div>
                <Label htmlFor="clean-level">Clean Level</Label>
                <Select
                  value={form.cleanLevel}
                  onValueChange={(v) => setField("cleanLevel", v as "1" | "2" | "3")}
                >
                  <SelectTrigger id="clean-level" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Light</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hourly Rate */}
              <div>
                <Label htmlFor="hourly-rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly-rate"
                  type="number"
                  min={1}
                  placeholder="40"
                  value={form.hourlyRate}
                  onChange={(e) => setField("hourlyRate", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Bedrooms */}
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min={0}
                  placeholder="e.g. 3"
                  value={form.bedrooms}
                  onChange={(e) => setField("bedrooms", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Bathrooms */}
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min={0}
                  placeholder="e.g. 2"
                  value={form.bathrooms}
                  onChange={(e) => setField("bathrooms", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Pets */}
              <div>
                <Label htmlFor="pets">Pets</Label>
                <Input
                  id="pets"
                  type="number"
                  min={0}
                  placeholder="e.g. 1"
                  value={form.pets}
                  onChange={(e) => setField("pets", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Children */}
              <div>
                <Label htmlFor="children">Children</Label>
                <Input
                  id="children"
                  type="number"
                  min={0}
                  placeholder="e.g. 2"
                  value={form.children}
                  onChange={(e) => setField("children", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={handleGenerate}>
                Generate Quote
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset} aria-label="Reset form">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Your Quote</h2>
            </div>

            <TooltipProvider delayDuration={100}>
            <div className="grid gap-3 sm:grid-cols-2">
              {RESULT_LABELS.map(({ key, label, subtitle, recommended, hoursMultiplier }) => {
                const totalHrs = key === "moveInMoveOut"
                  ? result.totalHours + 2
                  : result.totalHours * hoursMultiplier
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedTier(key)}
                    aria-pressed={selectedTier === key}
                    className={cn(
                      "relative flex w-full items-center justify-between rounded-xl border p-4 text-left transition-shadow hover:shadow-sm",
                      selectedTier === key
                        ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "border-border bg-card text-card-foreground",
                    )}
                  >
                    {selectedTier === key && (
                      <div className="absolute -top-2.5 left-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-semibold text-yellow-900">
                          <Star className="h-2.5 w-2.5 fill-yellow-900" />
                          {key === "biweekly" ? "Recommended" : "Selected"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className={cn("text-sm font-medium", recommended ? "text-primary-foreground" : "text-foreground")}>
                        {label}
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className={cn("flex items-center gap-1 text-xs mt-0.5", recommended ? "text-primary-foreground/70" : "text-muted-foreground")}>
                            <span>{subtitle}</span>
                            <Info className={cn("h-3 w-3 shrink-0", recommended ? "text-primary-foreground" : "text-primary")} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" showArrow={false} className="bg-white text-foreground border border-border shadow-md rounded-lg px-2.5 py-1.5 space-y-0.5 text-[11px]">
                          <p className="font-bold text-foreground">Estimated Labor Time</p>
                          <p className="text-foreground"><span className="font-bold">1 Cleaner:</span> {formatHours(totalHrs)}</p>
                          <p className="text-foreground"><span className="font-bold">2 Cleaners:</span> {formatHours(totalHrs / 2)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span
                      className={cn(
                        "text-xl font-black",
                        recommended ? "text-primary-foreground" : "text-foreground",
                      )}
                    >
                      ${result[key].toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>
            </TooltipProvider>

            <AIQuoteReview quote={{ squareFootage: parseFloat(form.squareFootage) || 0, bedrooms: parseFloat(form.bedrooms) || 0, bathrooms: parseFloat(form.bathrooms) || 0, serviceType: "Residential cleaning", cleaningLevel: ["Light", "Medium", "Heavy"][parseInt(form.cleanLevel) - 1], recurringFrequency: RESULT_LABELS.find(({ key }) => key === selectedTier)?.label ?? "Flexible", pets: parseFloat(form.pets) || 0, addOns: [], estimatedHours: result.totalHours * (RESULT_LABELS.find(({ key }) => key === selectedTier)?.hoursMultiplier ?? 1), notes: "", checklist: null, totalPrice: result[selectedTier] }} />

            <p className="mt-4 text-center text-xs text-muted-foreground">
                Based on ${form.hourlyRate}/hr &middot; {form.squareFootage} {sqftUnit === "sqft" ? "sq ft" : "m²"} &middot;{" "}
              {["Light", "Medium", "Heavy"][parseInt(form.cleanLevel) - 1]} clean
            </p>

            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-center">
              <p className="text-sm text-muted-foreground">
                Want to personalize, save, and share this quote?
              </p>
              <Link
                href="/login"
                className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Log in to continue
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
