import Link from "next/link"
import { Button } from "@/components/ui/button"

export function FinalCTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="rounded-3xl border border-primary bg-primary px-8 py-14 shadow-lg shadow-primary/15">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Start quoting like a pro today
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="min-w-44 shadow-sm" asChild>
              <Link href="/dashboard">Get Started Free</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-primary-foreground/75">
            No credit card required &middot; Free plan available
          </p>
        </div>
      </div>
    </section>
  )
}
