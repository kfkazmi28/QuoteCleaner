"use client"

import { useState } from "react"
import { ArrowRight, Home, Zap, Send } from "lucide-react"

const steps = [
  {
    icon: Home,
    number: "1",
    title: "Enter property details",
    description: "Add square footage, bedrooms, bathrooms, clean level, and any special factors.",
  },
  {
    icon: Zap,
    number: "2",
    title: "Generate instant pricing",
    description: "Get accurate pricing across six service tiers — from deep cleans to weekly recurring.",
  },
  {
    icon: Send,
    number: "3",
    title: "Save and send to clients",
    description: "Save the quote to your dashboard and send a polished estimate directly to your client.",
  },
]

export function HowItWorks() {
  const [showSummary, setShowSummary] = useState(false)

  return (
    <section className="relative overflow-hidden border-y border-border bg-card py-20">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-chart-3/10 blur-3xl" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Three simple steps to professional pricing
          </p>
          <button
            type="button"
            onClick={() => setShowSummary((current) => !current)}
            aria-expanded={showSummary}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            {showSummary ? "Hide workflow summary" : "Explore the workflow"}
            <ArrowRight className={`h-4 w-4 transition-transform ${showSummary ? "rotate-90" : ""}`} aria-hidden="true" />
          </button>
        </div>

        {showSummary && (
          <div className="mb-8 grid gap-x-8 gap-y-5 border-y border-primary/20 py-5 text-left sm:grid-cols-3">
            <div><p className="font-semibold text-foreground">Quote faster</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Use your pricing rules to create a polished estimate in seconds.</p></div>
            <div><p className="font-semibold text-foreground">Stay organized</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Keep client details, quotes, and follow-ups together in one place.</p></div>
            <div><p className="font-semibold text-foreground">Book confidently</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Turn accepted quotes into scheduled cleaning jobs without retyping.</p></div>
          </div>
        )}

        <div className="relative divide-y divide-border sm:flex sm:divide-x sm:divide-y-0">
          {steps.map((s) => (
            <div
              key={s.number}
              className="flex flex-1 gap-4 py-6 first:pt-0 last:pb-0 sm:block sm:px-7 sm:py-2 sm:first:pl-0 sm:last:pr-0"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-3xl font-black text-muted-foreground/30 select-none leading-none">
                  {s.number}
                </span>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-card-foreground">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
