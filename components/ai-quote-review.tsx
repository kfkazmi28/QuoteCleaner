"use client"

import { useState } from "react"
import { ChevronDown, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
type QuoteReviewInput = { squareFootage: number; bedrooms: number; bathrooms: number; serviceType: string; cleaningLevel: string; recurringFrequency: string; pets: number; addOns: string[]; estimatedHours: number; notes: string; checklist: unknown; totalPrice: number }
type QuoteReview = { confidenceScore: number; estimatedMarketPriceRange: { min: number; max: number }; pricingFeedback: string; suggestedUpsells: string[]; missingServices: string[]; estimatedLaborHours: number; estimatedProfit: number; summary: string }

export function AIQuoteReview({ quote }: { quote: QuoteReviewInput }) {
  const [open, setOpen] = useState(false)
  const [review, setReview] = useState<QuoteReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleOpen() {
    const nextOpen = !open
    setOpen(nextOpen)
    if (!nextOpen || review || loading) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/quote-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(quote) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to review quote")
      setReview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review quote")
    } finally { setLoading(false) }
  }

  return <div className="mt-5 overflow-hidden rounded-xl border border-primary/20 bg-primary/5">
    <button type="button" onClick={handleOpen} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary/10">
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-primary" /> AI Quote Review</span>
      <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", open && "rotate-180")} />
    </button>
    {open && <div className="border-t border-primary/15 px-4 py-4">
      {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reviewing your quote...</div>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {review && <div className="space-y-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold text-foreground">{review.summary}</p><span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">Confidence {review.confidenceScore}/5</span></div><div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Market range</p><p className="font-semibold text-foreground">${review.estimatedMarketPriceRange.min}–${review.estimatedMarketPriceRange.max}</p></div><div><p className="text-xs text-muted-foreground">Labor estimate</p><p className="font-semibold text-foreground">{review.estimatedLaborHours.toFixed(1)} hrs</p></div><div><p className="text-xs text-muted-foreground">Estimated profit</p><p className="font-semibold text-primary">${review.estimatedProfit.toFixed(0)}</p></div></div><p className="leading-relaxed text-muted-foreground">{review.pricingFeedback}</p><div className="grid gap-4 sm:grid-cols-2"><div><p className="font-semibold text-foreground">Suggested upsells</p><ul className="mt-1 list-disc pl-4 text-muted-foreground">{review.suggestedUpsells.map((item) => <li key={item}>{item}</li>)}</ul></div><div><p className="font-semibold text-foreground">Missing services</p><ul className="mt-1 list-disc pl-4 text-muted-foreground">{review.missingServices.map((item) => <li key={item}>{item}</li>)}</ul></div></div></div>}
    </div>}
  </div>
}
