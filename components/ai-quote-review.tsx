"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ChevronDown, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
type QuoteReviewInput = { squareFootage: number; bedrooms: number; bathrooms: number; city?: string; zip?: string; serviceType: string; cleaningLevel: string; recurringFrequency: string; pets: number; addOns: string[]; estimatedHours: number; notes: string; checklist: unknown; totalPrice: number }
type QuoteReview = { confidenceScore: number; estimatedMarketPriceRange: { min: number; max: number }; pricingFeedback: string; suggestedUpsells: string[]; missingServices: string[]; estimatedLaborHours: number; estimatedProfit: number; summary: string }

export function AIQuoteReview({ quote }: { quote: QuoteReviewInput }) {
  const [open, setOpen] = useState(false)
  const [review, setReview] = useState<QuoteReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setAuthenticated(Boolean(data.user)))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setAuthenticated(Boolean(session?.user)))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleOpen() {
    const nextOpen = !open
    setOpen(nextOpen)
    if (!nextOpen || review || loading || !authenticated) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/quote-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(quote) })
      const contentType = response.headers.get("content-type") ?? ""
      const data = contentType.includes("application/json") ? await response.json() : null
      if (!response.ok) throw new Error(data?.error || "The AI review service is temporarily unavailable")
      if (!data) throw new Error("The AI review returned an invalid response")
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
      {!authenticated && <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-foreground">Sign in to unlock your AI quote review</p><p className="mt-1 text-sm text-muted-foreground">Get pricing feedback, market context, and upsell suggestions for this quote.</p></div><Link href="/login" className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Log in to continue</Link></div>}
      {authenticated && loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reviewing your quote...</div>}
      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"><p className="font-medium">AI review unavailable</p><p className="mt-1">{error}</p></div>}
      {review && <div className="space-y-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold text-foreground">{review.summary}</p><span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">Confidence {review.confidenceScore}/5</span></div><div className="rounded-lg border border-primary/20 bg-primary/5 p-4"><div className="mb-3"><p className="font-semibold text-foreground">25-50-25 profit model</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">50% funds fully loaded direct labor, 25% covers overhead and marketing, and 25% is the target net profit.</p></div><div className="grid gap-2 sm:grid-cols-3"><div className="rounded-md bg-background/80 p-3"><p className="text-xs font-medium text-muted-foreground">50% Direct labor</p><p className="mt-1 text-lg font-bold text-foreground">${(quote.totalPrice * 0.5).toFixed(0)}</p><p className="text-xs text-muted-foreground">Wages, taxes, insurance, supplies</p></div><div className="rounded-md bg-background/80 p-3"><p className="text-xs font-medium text-muted-foreground">25% Overhead + marketing</p><p className="mt-1 text-lg font-bold text-foreground">${(quote.totalPrice * 0.25).toFixed(0)}</p><p className="text-xs text-muted-foreground">Software, fuel, ads, maintenance</p></div><div className="rounded-md bg-background/80 p-3"><p className="text-xs font-medium text-muted-foreground">25% Target net profit</p><p className="mt-1 text-lg font-bold text-primary">${(quote.totalPrice * 0.25).toFixed(0)}</p><p className="text-xs text-muted-foreground">Owner profit or growth</p></div></div></div><div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Market range</p><p className="font-semibold text-foreground">${review.estimatedMarketPriceRange.min}–${review.estimatedMarketPriceRange.max}</p></div><div><p className="text-xs text-muted-foreground">Labor hours</p><p className="font-semibold text-foreground">{review.estimatedLaborHours.toFixed(1)} hrs</p></div><div><p className="text-xs text-muted-foreground">Estimated profit</p><p className="font-semibold text-primary">${review.estimatedProfit.toFixed(0)}</p></div></div><div className="rounded-lg border bg-background/70 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-foreground">AI pricing feedback</p><p className="mt-1 leading-relaxed text-muted-foreground">{review.pricingFeedback}</p></div><div className="grid gap-4 sm:grid-cols-2"><div><p className="font-semibold text-foreground">Suggested upsells</p><ul className="mt-1 list-disc pl-4 text-muted-foreground">{review.suggestedUpsells.map((item) => <li key={item}>{item}</li>)}</ul></div><div><p className="font-semibold text-foreground">Missing services</p><ul className="mt-1 list-disc pl-4 text-muted-foreground">{review.missingServices.map((item) => <li key={item}>{item}</li>)}</ul></div></div></div>}
    </div>}
  </div>
}
