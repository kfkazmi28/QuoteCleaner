import Link from "next/link"
import { Button } from "@/components/ui/button"

export function FinalCTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary bg-primary px-8 py-14 shadow-lg shadow-primary/15">
          <div className="pointer-events-none absolute right-8 top-6 h-20 w-20 rounded-full bg-brand-pink/35 blur-2xl" />
          <div className="relative">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-brand-pink">Fresh start, brighter business</p>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Start quoting like a <span className="text-brand-pink">pro</span> today
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="min-w-44 shadow-sm" asChild>
              <Link href="/dashboard">Get Started Free</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-brand-pink/90">
            No credit card required &middot; Free plan available
          </p>
          </div>
        </div>
      </div>
    </section>
  )
}
