"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Zap } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { createCheckoutSession } from "@/app/actions/stripe"
import { createClient } from "@/lib/supabase/client"

const plans = [
  {
    name: "Free",
    price: { monthly: null },
    description: "Get started with one quote per week.",
    features: [
      { label: "3 quotes per week" },
      { label: "Save up to 3 quotes per week" },
      { label: "Instant pricing calculations" },
    ],
    cta: "Get Started",
    href: "/login",
    highlight: false,
  },
  {
    name: "Pro",
    price: { monthly: 8.99 },
    description: "Everything you need to quote without limits.",
    features: [
      { label: "Unlimited quotes & saves" },
      { label: "Full pricing customization" },
      { label: "Save and manage all quotes" },
      { label: "Built-in client & job tracking" },
      { label: "Includes 2 team members", sub: "+$5/mo each additional" },
    ],
    cta: "Upgrade Now",
    href: "/login",
    highlight: true,
  },
  {
    name: "Pro Plus",
    price: { weekly: null, monthly: 29 },
    description: "Built for teams and growing cleaning companies.",
    features: [
      { label: "Team accounts" },
      { label: "Branded quotes" },
      { label: "Client CRM" },
      { label: "Advanced settings" },
    ],
    cta: "Go Pro Plus",
    href: "/login",
    highlight: false,
  },
]

// Set to true to re-enable the Pro Plus tier when ready
const showProPlus = false

export default function PricingPage() {
  const billing = "monthly" as const
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleUpgrade = () => {
    startTransition(async () => {
      // Check auth first — guests must sign up before paying
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push("/login")
        return
      }
      const { url } = await createCheckoutSession()
      // Use window.top to escape iframes (e.g. v0 preview) and redirect the real browser tab
      const target = window.top ?? window
      target.location.href = url
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden bg-background py-16 sm:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.94_0.06_220/0.4),transparent)]"
          />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-base text-muted-foreground">
              Start free and upgrade when you&apos;re ready. No hidden fees, cancel anytime.
            </p>

          </div>
        </section>

        {/* Plans */}
        <section className="pb-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {plans.filter((plan) => showProPlus || plan.name !== "Pro Plus").map((plan) => {
                const price = plan.price.monthly

                return (
                  <div
                    key={plan.name}
                    className={cn(
                      "relative flex flex-col rounded-2xl border p-6 shadow-sm",
                      plan.highlight
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border-border bg-card text-card-foreground",
                    )}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-yellow-900">
                          <Zap className="h-3 w-3" />
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <h2
                        className={cn(
                          "mb-1 text-xl font-bold",
                          plan.highlight ? "text-primary-foreground" : "text-foreground",
                        )}
                      >
                        {plan.name}
                      </h2>
                      <p
                        className={cn(
                          "text-sm",
                          plan.highlight ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        {plan.description}
                      </p>

                      <div className="mt-4">
                        {price !== null && price !== undefined ? (
                          <div className="flex items-end gap-1">
                            <span
                              className={cn(
                                "text-4xl font-black",
                                plan.highlight ? "text-primary-foreground" : "text-foreground",
                              )}
                            >
                              ${price}
                            </span>
                            <span
                              className={cn(
                                "mb-1 text-sm",
                                plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground",
                              )}
                            >
                              /mo
                            </span>
                          </div>
                        ) : plan.name === "Free" ? (
                          <div className="flex items-end gap-1">
                            <span
                              className={cn(
                                "text-4xl font-black",
                                plan.highlight ? "text-primary-foreground" : "text-foreground",
                              )}
                            >
                              $0
                            </span>
                            <span
                              className={cn(
                                "mb-1 text-sm",
                                plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground",
                              )}
                            >
                              forever
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-end gap-1">
                            <span
                              className={cn(
                                "text-4xl font-black",
                                plan.highlight ? "text-primary-foreground" : "text-foreground",
                              )}
                            >
                              ${plan.price.monthly}
                            </span>
                            <span
                              className={cn(
                                "mb-1 text-sm",
                                plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground",
                              )}
                            >
                              /mo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ul className="mb-8 flex flex-col gap-2.5">
                      {plan.features.map((f) => (
                        <li key={f.label} className="flex items-start gap-2.5 text-sm">
                          <Check
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              plan.highlight ? "text-primary-foreground" : "text-primary",
                            )}
                          />
                          <span className="flex flex-col">
                            <span
                              className={cn(
                                plan.highlight ? "text-primary-foreground/90" : "text-foreground",
                              )}
                            >
                              {f.label}
                            </span>
                            {f.sub && (
                              <span
                                className={cn(
                                  "text-xs",
                                  plan.highlight ? "text-primary-foreground/60" : "text-muted-foreground",
                                )}
                              >
                                {f.sub}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      {plan.name === "Pro" ? (
                        <Button
                          onClick={handleUpgrade}
                          disabled={isPending}
                          className={cn(
                            "w-full",
                            "bg-primary-foreground text-primary hover:bg-primary-foreground/90",
                          )}
                        >
                          {isPending ? (
                            <span className="flex items-center gap-2">
                              <Spinner className="h-4 w-4" />
                              Redirecting...
                            </span>
                          ) : (
                            plan.cta
                          )}
                        </Button>
                      ) : (
                        <Button
                          asChild
                          className={cn(
                            "w-full",
                            plan.highlight
                              ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                              : "",
                          )}
                          variant={plan.highlight ? "default" : "outline"}
                        >
                          <Link href={plan.href}>{plan.cta}</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              All plans include mobile access and our core calculator.{" "}
              <Link href="/login" className="text-primary underline underline-offset-4">
                Start free &rarr;
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
