"use client"

import { useState } from "react"

const features = [
  ["Smart Quote Calculator", "Create accurate, professional quotes in minutes with pricing that fits the way you work."],
  ["Scheduling & Calendar", "Book jobs, manage your schedule, and keep every appointment in one clear view."],
  ["Invoices & Payments", "Turn accepted quotes into polished invoices and get paid faster with Stripe."],
  ["Client Management", "Keep client notes, history, and communication organized in one welcoming workspace."],
] as const

export function FeaturesPreview() {
  const [openFeature, setOpenFeature] = useState(0)

  return (
    <section className="relative overflow-visible bg-background py-12 sm:py-16">
      <div className="pointer-events-none absolute left-0 top-20 h-72 w-72 rounded-full bg-chart-4/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">One simple workspace</p><h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Everything you need to run your business beautifully.</h2><p className="mt-5 text-lg leading-relaxed text-muted-foreground">From the first estimate to the final payment, every tool works together.</p></div>
        <div className="relative mt-8 grid min-w-0 gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-max">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-12 hidden border-t border-dashed border-primary/30 lg:block" />
          {features.map(([title, description], index) => (
            <details key={title} open={openFeature === index} className="contents group">
              <summary onClick={(event) => { event.preventDefault(); setOpenFeature(openFeature === index ? -1 : index) }} className={`flex min-h-52 min-w-0 cursor-pointer list-none flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card px-5 py-6 text-center shadow-sm outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary group-open:border-primary/40 group-open:shadow-lg group-open:shadow-primary/10 sm:row-start-1 sm:col-span-1 ${index === 0 ? "sm:col-start-1" : index === 1 ? "sm:col-start-2" : index === 2 ? "sm:col-start-3" : "sm:col-start-4"} lg:col-span-1 lg:row-start-1` }>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-md shadow-primary/20">{index + 1}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Feature {index + 1}</span>
                <span className="text-xl font-bold tracking-tight text-foreground">{title}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{description}</span>
                <span className="inline-flex items-center gap-2 font-semibold text-brand-pink">Explore the workflow <span className="inline-block transition-transform group-open:rotate-90" aria-hidden="true">→</span></span>
              </summary>
              <div style={{ gridColumn: "auto", gridRow: "2", width: "calc(400% + 48px)", marginLeft: `calc(${index} * -100% - ${index} * 16px)` }} className="w-full min-w-0 max-w-none overflow-hidden rounded-3xl border border-primary/20 bg-secondary/95 px-4 py-4 shadow-xl shadow-primary/10 backdrop-blur-sm">
                <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-chart-3" /><span className="text-xs font-semibold text-muted-foreground">CleanQuote Pro</span></div>
                    <span className="text-xs text-muted-foreground">{title}</span>
                  </div>
                  {title === "Smart Quote Calculator" && <div className="grid gap-5 p-5 sm:grid-cols-[1fr_0.8fr]"><div><p className="text-sm font-semibold text-foreground">New quote</p><div className="mt-4 space-y-3"><div><p className="mb-1 text-[11px] text-muted-foreground">Client name</p><p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">Amanda Rivera</p></div><div><p className="mb-1 text-[11px] text-muted-foreground">Service</p><p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">Deep clean · 3 bed / 2 bath</p></div><div><p className="mb-1 text-[11px] text-muted-foreground">Property size</p><p className="w-2/3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">1,850 sq ft</p></div></div><div className="mt-5 rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">Create quote</div></div><div className="rounded-xl bg-accent/50 p-4"><p className="text-xs text-muted-foreground">Estimated total</p><p className="mt-2 text-2xl font-bold text-primary">$285.00</p><p className="mt-2 text-xs text-muted-foreground">Includes supplies and labor</p><div className="mt-5 h-2 rounded-full bg-primary/20"><div className="h-2 w-3/4 rounded-full bg-primary" /></div></div></div>}
                  {title === "Scheduling & Calendar" && <div className="grid gap-4 p-5 sm:grid-cols-[0.8fr_1.2fr]"><div className="space-y-3"><div className="rounded-lg border border-primary/20 bg-primary/10 p-3"><p className="text-xs font-semibold text-primary">Today · May 24</p><p className="mt-1 text-sm font-medium text-foreground">Deep clean · 10:00 AM</p><p className="text-xs text-muted-foreground">Amanda Rivera</p></div><div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Tomorrow · 2:00 PM</p><p className="mt-1 text-sm font-medium text-foreground">Move-out clean</p></div><div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">May 26 · 9:00 AM</p><p className="mt-1 text-sm font-medium text-foreground">Maintenance visit</p></div></div><div className="rounded-xl border border-border p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-foreground">May 2026</p><span className="text-xs text-primary">Week view</span></div><div className="mt-4 grid grid-cols-7 gap-2 text-center text-[10px] text-muted-foreground">{["M","T","W","T","F","S","S"].map((day, i) => <span key={`${day}-${i}`}>{day}</span>)}{Array.from({ length: 21 }).map((_, i) => <span key={i} className={`rounded-md py-2 text-xs ${i === 9 ? "bg-primary font-semibold text-primary-foreground" : "bg-secondary text-foreground"}`}>{i + 1}</span>)}</div></div></div>}
                  {title === "Invoices & Payments" && <div className="grid gap-4 p-5 sm:grid-cols-3"><div className="rounded-xl bg-accent/50 p-4 sm:col-span-2"><p className="text-xs text-muted-foreground">Invoice #1048</p><p className="mt-3 text-xl font-bold text-foreground">Sparkle Clean Co.</p><div className="mt-6 flex justify-between border-t border-border pt-4 text-sm"><span className="text-muted-foreground">Deep clean service</span><span className="font-medium text-foreground">$285.00</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Supplies</span><span className="font-medium text-foreground">$35.00</span></div></div><div className="rounded-xl bg-chart-4/15 p-4"><p className="text-xs text-muted-foreground">Paid</p><p className="mt-3 text-2xl font-bold text-chart-4">$420</p></div></div>}
                  {title === "Client Management" && <div className="grid gap-3 p-5 sm:grid-cols-2"><div className="rounded-xl bg-secondary p-4"><div className="h-10 w-10 rounded-full bg-primary/20" /><p className="mt-3 font-semibold text-foreground">Amanda Rivera</p><p className="text-xs text-muted-foreground">Sparkle Clean Co.</p></div><div className="space-y-3"><div className="rounded-lg border border-border p-3"><p className="text-xs font-semibold text-foreground">Last quote</p><p className="mt-1 text-sm text-muted-foreground">Deep clean · $285.00</p><p className="mt-1 text-xs text-primary">Accepted May 22</p></div><div className="rounded-lg border border-border p-3"><p className="text-xs font-semibold text-foreground">Next follow-up</p><p className="mt-1 text-sm text-muted-foreground">Send appointment reminder</p><p className="mt-1 text-xs text-primary">Due tomorrow</p></div></div></div>}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
