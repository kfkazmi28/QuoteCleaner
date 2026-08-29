"use client"

import Image from "next/image"
import { Home, Zap, Send } from "lucide-react"

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
  return (
    <section className="relative overflow-hidden bg-secondary/20 py-12 sm:py-16">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-chart-3/10 blur-3xl" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Three simple steps to professional pricing
          </p>
        </div>

        <div className="relative grid gap-8 border-l border-primary/25 pl-7 sm:grid-cols-3 sm:gap-0 sm:border-l-0 sm:border-t sm:pl-0">
          {steps.map((s, index) => (
            <div key={s.number} className="relative sm:px-7 sm:pt-8 sm:first:pl-0 sm:last:pr-0">
              <div className="absolute -left-[2.15rem] top-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-secondary bg-primary text-primary-foreground sm:left-0 sm:top-[-1.15rem]">
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Step {s.number}</p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              {index < steps.length - 1 && <span className="absolute right-0 top-[-0.2rem] hidden h-px w-8 bg-primary/25 sm:block" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-10 h-28 overflow-hidden sm:mt-12 sm:h-36">
        <Image src="/images/cleaning-tools-banner-v2.png" alt="Colorful cleaning tools, lemons, bubbles, and water splashes" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-primary/5 mix-blend-multiply" />
      </div>
    </section>
  )
}
