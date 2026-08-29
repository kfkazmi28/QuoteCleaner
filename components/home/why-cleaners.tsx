import { DollarSign, Bolt, Star, BarChart2, Smartphone } from "lucide-react"

const features = [
  {
    icon: DollarSign,
    title: "Stop undercharging",
    description: "Know exactly what to charge every time based on real job factors.",
  },
  {
    icon: Bolt,
    title: "Quote faster",
    description: "Generate a full price breakdown in seconds, not minutes.",
  },
  {
    icon: Star,
    title: "Look professional",
    description: "Impress clients with polished, itemized pricing they can trust.",
  },
  {
    icon: BarChart2,
    title: "Consistent pricing",
    description: "Same formula every time — no more guessing or last-minute adjustments.",
  },
  {
    icon: Smartphone,
    title: "Works on phone",
    description: "Quote jobs on-site from any device with a beautiful mobile UI.",
  },
]

export function WhyCleaners() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why Cleaners Love It
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to price confidently and grow your business
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-card-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
