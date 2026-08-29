import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Try it out at no cost.",
    features: ["Up to 3 saved quotes", "All pricing tiers", "Mobile friendly"],
    cta: "Get Started Free",
    href: "/dashboard",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/mo",
    description: "For cleaners ready to grow.",
    features: ["Unlimited saved quotes", "Client info & notes", "Send & export quotes", "More Custom Options"],
    cta: "Upgrade to Pro",
    href: "/pricing",
    highlight: true,
  },
]

export function PricingPreview() {
  return (
    <section className="bg-muted/30 dark:bg-card/60 py-20 border-t border-border">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-6 shadow-sm ${
                plan.highlight
                  ? "border-primary bg-card ring-1 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlight && (
                <div className="mb-4 inline-flex w-fit rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}

              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="mb-1 text-sm font-semibold text-foreground">{plan.name}</p>
              <p className="mb-5 text-sm text-muted-foreground">{plan.description}</p>

              <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? "default" : "outline"}
                className="w-full"
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
