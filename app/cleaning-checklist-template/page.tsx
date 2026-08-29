"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { CheckSquare, Download, CheckCircle, ClipboardList, Users, TrendingUp, Star } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

function DownloadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/checklist-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null, email: email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Something went wrong")
        return
      }
      setDone(true)
      toast.success("Your checklist bundle is ready")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setDone(false)
      setName("")
      setEmail("")
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {!done ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Get Your Free Checklist Bundle</DialogTitle>
              <DialogDescription>
                Enter your email to instantly download all 3 cleaning checklists in one PDF.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cl-name">
                  Name <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="cl-name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cl-email">
                  Email <span className="text-destructive text-xs">*</span>
                </Label>
                <Input
                  id="cl-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Download Full Checklist Bundle"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                No spam. Just tools to grow your cleaning business.
              </p>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Your checklist bundle is ready</p>
              <p className="mt-1 text-sm text-muted-foreground">
                All 3 checklists are included in one printable PDF.
              </p>
            </div>
            <Button className="w-full gap-2" onClick={() => window.open("/cleaning-checklist-pack.pdf", "_blank")}>
              <Download className="h-4 w-4" />
              Download Checklist PDF
            </Button>
            <button
              onClick={handleClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

const benefits = [
  { icon: ClipboardList, title: "3 Templates Included", desc: "Residential, deep clean, and move-in/out — all in one PDF bundle." },
  { icon: CheckSquare, title: "50 Items Each", desc: "Comprehensive coverage so nothing gets missed on the job." },
  { icon: Users, title: "Great for Teams", desc: "Hand to any cleaner and they know exactly what to do." },
  { icon: Star, title: "100% Free", desc: "No credit card. No login required." },
]

const whyChecklists = [
  { icon: TrendingUp, title: "Consistency Across Every Job", desc: "When every cleaner follows the same checklist, the quality of your work stays consistent regardless of who is on the job. This is what separates one-time clients from recurring contracts." },
  { icon: Users, title: "Easier Team Training", desc: "New hires can follow a checklist from day one. Instead of relying on memory or shadowing someone for weeks, a checklist gives them a clear roadmap to do the job right." },
  { icon: CheckSquare, title: "Client Accountability", desc: "If a client claims something was missed, a signed checklist proves what was completed. This protects your business and your reputation." },
]

const checklistPreviews = [
  {
    title: "Residential Cleaning Checklist",
    desc: "Perfect for standard weekly, bi-weekly, or monthly recurring clients.",
    sections: ["Living Areas (10 items)", "Kitchen (10 items)", "Bathrooms (10 items)", "Bedrooms (10 items)", "Final Checks (10 items)"],
  },
  {
    title: "Deep Cleaning Checklist",
    desc: "For clients who need a thorough clean — inside cabinets, appliances, grout lines, and more.",
    sections: ["Kitchen Deep Clean (10 items)", "Bathrooms Deep Clean (10 items)", "Bedroom & Living Areas (10 items)", "Windows & Surfaces (10 items)", "Final Checks (10 items)"],
  },
  {
    title: "Move-In / Move-Out Checklist",
    desc: "Built for vacant properties — covers every area a landlord or property manager will inspect.",
    sections: ["Kitchen (10 items)", "Bathrooms (10 items)", "Bedrooms & Living Areas (10 items)", "Windows & Doors (10 items)", "Final Checks (10 items)"],
  },
]

export default function CleaningChecklistTemplatePage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <CheckSquare className="h-3 w-3" />
            Free Download — 3 Templates
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Free 50-Point Cleaning Checklist (3 Templates Included)
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Download 3 professional cleaning checklists you can use for residential, deep cleaning, and move-in/move-out jobs. Print them, hand them to your team, and never miss a detail again.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 px-8" onClick={() => setModalOpen(true)}>
              <Download className="h-4 w-4" />
              Download Free Checklists
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">No login required &mdash; instant access to all 3</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-8">

        {/* Why checklists matter */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">Why Cleaning Checklists Matter</h2>
        <p className="mb-6 text-muted-foreground leading-relaxed">
          The difference between an average cleaning business and a great one often comes down to systems. A cleaning checklist is one of the simplest systems you can put in place — and one of the most impactful.
        </p>
        <div className="mb-10 space-y-5">
          {whyChecklists.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Checklist previews */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">What&apos;s Inside Each Checklist</h2>
        <p className="mb-6 text-muted-foreground">Each of the 3 templates includes 50 checklist items organized into 5 sections:</p>
        <div className="mb-10 space-y-4">
          {checklistPreviews.map((cl, i) => (
            <div key={cl.title} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <p className="font-semibold text-foreground">{cl.title}</p>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{cl.desc}</p>
              <ul className="space-y-1">
                {cl.sections.map(s => (
                  <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* How to use */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">How to Use These Checklists</h2>
        <ul className="mb-8 space-y-2 text-muted-foreground">
          {[
            "Print one checklist per job and hand it to your cleaner",
            "Have the cleaner initial or check off each item as completed",
            "Keep a signed copy on file in case of disputes",
            "Use the deep clean version for first-time clients",
            "Use the move-in/out version for vacant property jobs",
          ].map(item => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {/* Calculator link */}
        <div className="mb-10 rounded-2xl border border-border bg-card p-6">
          <p className="mb-1 font-semibold text-foreground">Want accurate prices to go with your checklists?</p>
          <p className="mb-4 text-sm text-muted-foreground">Use our free cleaning calculator to build a professional quote for every job type.</p>
          <Link href="/cleaning-estimate-calculator">
            <Button variant="outline" className="gap-2">
              Use Cleaning Calculator
            </Button>
          </Link>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-foreground">Stop Winging It. Start Using a System.</h2>
          <p className="mb-5 text-muted-foreground">Download all 3 free checklists and start every job with a professional process.</p>
          <Button size="lg" className="gap-2 px-8" onClick={() => setModalOpen(true)}>
            <Download className="h-4 w-4" />
            Download Free Checklists
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">Free forever &mdash; provided by CleanQuote Pro</p>
        </div>
      </section>

      <DownloadModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </main>
      <Footer />
    </div>
  )
}
