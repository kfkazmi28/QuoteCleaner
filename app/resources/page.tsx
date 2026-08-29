import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileText, ClipboardList, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Free Cleaning Business Templates & Tools | CleanQuote Pro",
  description:
    "Free resources for cleaning business owners — contracts, checklists, and pricing tools to help you stay organized, save time, and win more clients.",
}

const resources = [
  {
    icon: FileText,
    title: "Free Cleaning Contract Template",
    description:
      "Download a professional cleaning service agreement template to protect your business and set clear expectations with clients.",
    href: "/cleaning-contract-template",
    label: "View Template",
  },
  {
    icon: ClipboardList,
    title: "Professional Cleaning Checklist Pack",
    description:
      "Download a printable checklist pack for standard cleans, deep cleans, and move-in ready jobs.",
    href: "/cleaning-checklist-template",
    label: "View Checklist Pack",
  },
]

export default function ResourcesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto max-w-5xl w-full px-4 py-16 sm:px-6 flex-1">
      {/* Hero */}
      <div className="mb-12 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
          Free Cleaning Business Templates &amp; Tools
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Running a cleaning business requires more than just great service—you need systems,
          templates, and tools to stay organized and profitable. Below you&apos;ll find free
          resources including cleaning contracts, checklists, and pricing tools to help you
          streamline your business, save time, and win more clients.
        </p>
      </div>

      {/* Resource Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {resources.map(({ icon: Icon, title, description, href, label }) => (
          <div
            key={href}
            className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
            <div className="mt-6">
              <Button asChild variant="outline" className="gap-2">
                <Link href={href}>
                  {label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
      <Footer />
    </div>
  )
}
