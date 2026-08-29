import Image from "next/image"
import Link from "next/link"
import { Calculator, UsersRound, ArrowRight } from "lucide-react"

const highlights = [
  {
    icon: Calculator,
    title: "Quote with confidence",
    description:
      "Turn square footage, rooms, cleaning level, and recurring frequency into clear, consistent pricing in seconds.",
  },
  {
    icon: UsersRound,
    title: "Keep every client organized",
    description:
      "Manage contacts, saved quotes, scheduled cleanings, and invoices from one simple workspace built for cleaners.",
  },
]

export function CalculatorCrmInfo() {
  return (
    <section id="workflow-summary" className="relative scroll-mt-24 overflow-hidden bg-muted/30 py-12 sm:py-16">
      <Image
        src="/images/cleaning-tools-banner-v2.png"
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/95 via-background/75 to-secondary/25" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">One connected workflow</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              From first estimate to booked clean.
            </h2>
            <p className="mt-4 max-w-lg text-pretty leading-relaxed text-muted-foreground">
              QuoteCleaner brings your pricing and customer follow-up together, so you can spend less time switching tools and more time winning profitable jobs.
            </p>
            <Link
              href="/quote"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Try the free calculator <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {highlights.map(({ icon: Icon, title, description }) => (
              <article key={title} className="flex gap-4 py-6 first:pt-0 last:pb-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
