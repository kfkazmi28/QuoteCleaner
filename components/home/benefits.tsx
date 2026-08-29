import Link from "next/link"
import { Clock, Star, TrendingUp, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

const benefits = [
  { icon: Clock,        text: "Save time on every quote" },
  { icon: Star,         text: "Look more professional" },
  { icon: TrendingUp,   text: "Close more jobs" },
  { icon: Smartphone,   text: "Works on mobile" },
]

export function Benefits() {
  return (
    <section className="relative isolate overflow-hidden border-y border-border bg-gradient-to-br from-secondary via-background to-accent/45 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[url('/images/cleaning-brand-pattern.png')] bg-cover bg-center opacity-24" />
      <div className="pointer-events-none absolute inset-0 bg-background/45" />
      <div className="pointer-events-none absolute right-0 top-10 h-56 w-56 rounded-full bg-chart-2/10 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for cleaners who want to grow
          </h2>
        </div>

        <ul className="grid gap-x-10 divide-y divide-border border-y border-border sm:grid-cols-2 sm:divide-y-0">
          {benefits.map((b) => (
            <li
              key={b.text}
              className="flex items-center gap-3 py-5 first:pt-5 sm:border-b sm:border-border sm:py-5 sm:[&:nth-child(3)]:border-b-0 sm:[&:nth-child(4)]:border-b-0"
            >
              <b.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-medium text-foreground">{b.text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-3xl bg-primary px-6 py-12 text-center shadow-lg shadow-primary/15 sm:px-10">
          <h3 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Start quoting like a pro today
          </h3>
          <div className="mt-7 flex justify-center">
            <Button size="lg" className="min-w-44 shadow-sm" asChild>
              <Link href="/login">Login or Create an Account</Link>
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
