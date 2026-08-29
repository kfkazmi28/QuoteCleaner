import Link from "next/link"
import { CalendarDays, Check, CircleDollarSign, FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-secondary py-16 sm:py-24" style={{ backgroundImage: "url('/images/cleaning-brand-pattern.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/85 via-background/70 to-accent/65" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-chart-2/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary shadow-sm">
            <Sparkles className="h-4 w-4" /> Built for cleaning businesses
          </div>
          <h1 className="max-w-xl text-balance text-5xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-7xl">
            Quote. Book. Get Paid.
            <span className="block text-primary">All in One Place.</span>
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
            The easiest way to run a cleaning business. Create professional quotes, book more jobs, and grow with confidence.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
	<Button size="lg" className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90" asChild>
              <Link href="/quote">Try the Calculator</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> No credit card required</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Setup in under 60 seconds</span>
          </div>
        </div>
        <div className="relative min-h-[420px] sm:min-h-[500px]">
          <div className="absolute inset-x-4 top-8 rounded-3xl border border-border/80 bg-card/90 p-4 shadow-2xl shadow-primary/15 backdrop-blur sm:inset-x-10 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-4"><div className="font-bold">CleanQuote <span className="text-primary">Pro</span></div><div className="h-3 w-3 rounded-full bg-primary" /></div>
            <div className="grid gap-4 py-5 sm:grid-cols-[130px_1fr]"><div className="hidden space-y-2 text-xs text-muted-foreground sm:block"><p className="rounded-lg bg-primary/10 px-3 py-2 font-semibold text-primary">Dashboard</p><p className="px-3 py-2">Calculator</p><p className="px-3 py-2">Quotes</p><p className="px-3 py-2">Calendar</p></div><div><p className="text-sm text-muted-foreground">Good morning, Sarah</p><h2 className="mt-1 text-xl font-bold">Here&apos;s what&apos;s happening today.</h2><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Quotes Sent","28"],["Jobs Booked","14"],["Revenue","$8,420"],["Paid","9"]].map(([label,value]) => <div key={label} className="rounded-xl border border-border bg-background/70 p-3"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-2 text-lg font-bold">{value}</p><p className="mt-1 text-[10px] text-primary">+12% this week</p></div>)}</div><div className="mt-3 rounded-xl border border-border p-4"><p className="text-sm font-semibold">Upcoming jobs</p><div className="mt-3 space-y-2 text-xs text-muted-foreground"><p>Today, 10:00 AM · Deep Clean</p><p>Tomorrow, 2:00 PM · Move Out</p><p>May 24, 9:00 AM · Maintenance</p></div></div></div></div>
          </div>
          <div className="absolute -left-1 bottom-16 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl sm:left-0"><div className="rounded-xl bg-chart-3/20 p-2 text-chart-3"><FileText className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">New quote</p><p className="font-bold">$285.00</p></div></div>
          <div className="absolute -right-1 bottom-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl sm:right-0"><div className="rounded-xl bg-chart-4/20 p-2 text-chart-4"><CircleDollarSign className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">Payment received</p><p className="font-bold">+$420.00</p></div></div>
          <div className="absolute right-0 top-0 rounded-2xl border border-border bg-card p-3 shadow-xl"><CalendarDays className="h-5 w-5 text-primary" /></div>
        </div>
      </div>
    </section>
  )
}
