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
import { FileText, Download, CheckCircle, Shield, Clock, Star } from "lucide-react"
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
      const res = await fetch("/api/contract-template-lead", {
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
      toast.success("Template ready to download")
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
              <DialogTitle className="text-xl">Get Your Free Cleaning Contract Template</DialogTitle>
              <DialogDescription>
                Enter your email and we&apos;ll give you instant access to the downloadable cleaning contract template.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ct-name">
                  Name <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="ct-name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ct-email">
                  Email <span className="text-destructive text-xs">*</span>
                </Label>
                <Input
                  id="ct-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Download Template"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                No spam. Just helpful tools for cleaning businesses.
              </p>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">You&apos;re all set!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your free cleaning contract template is ready to download.
              </p>
            </div>
            <a
              href="/api/contract-template-pdf"
              download="cleaning-contract-template.pdf"
              className="w-full"
            >
              <Button className="w-full gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </a>
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
  { icon: FileText, title: "Professionally Formatted", desc: "Ready-to-use PDF with all essential sections." },
  { icon: Shield, title: "Legally Aware", desc: "Covers liability, cancellation, and payment terms." },
  { icon: Clock, title: "Saves You Time", desc: "Skip writing from scratch — fill in and go." },
  { icon: Star, title: "100% Free", desc: "No credit card. No login required." },
]

const contractSections = [
  "Client Information",
  "Service Provider Information",
  "Service Address",
  "Scope of Services",
  "Schedule and Frequency",
  "Pricing and Payment Terms",
  "Cancellation Policy",
  "Property Access",
  "Supplies and Equipment",
  "Damages and Liability",
  "Agreement and Signatures",
]

export default function CleaningContractTemplatePage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <FileText className="h-3 w-3" />
            Free Download
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Free Cleaning Contract Template (Download + Example)
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Use this free cleaning contract template to protect your business, set clear expectations, and avoid disputes with clients. Perfect for residential and commercial cleaning services.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 px-8" onClick={() => setModalOpen(true)}>
              <Download className="h-4 w-4" />
              Download Free Template
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">No login required &mdash; instant access</p>
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

      {/* Main content */}
      <section className="mx-auto max-w-3xl px-6 pb-8">

        {/* What is a cleaning contract */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">What Is a Cleaning Contract?</h2>
        <p className="mb-8 text-muted-foreground leading-relaxed">
          A cleaning contract is a written agreement between a cleaning service provider and a client. It outlines the scope of work, pricing, responsibilities, and terms of service — protecting both parties and setting clear expectations from day one.
        </p>

        {/* What should be included */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">What Should Be Included in a Cleaning Contract?</h2>
        <ul className="mb-8 space-y-2 text-muted-foreground">
          {["Services provided", "Pricing and payment terms", "Schedule and frequency", "Cancellation policy", "Liability and damages", "Access to the property"].map(item => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {/* What's inside */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">What&apos;s Inside This Template</h2>
        <p className="mb-5 text-muted-foreground">The downloaded PDF covers all 11 essential sections of a professional cleaning service agreement:</p>
        <div className="mb-8 grid gap-2.5 sm:grid-cols-2">
          {contractSections.map((s, i) => (
            <div key={s} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-foreground">{s}</span>
            </div>
          ))}
        </div>

        {/* Mid CTA */}
        <div className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="mb-1 font-semibold text-foreground">Ready to use it with your next client?</p>
          <p className="mb-4 text-sm text-muted-foreground">Download the free PDF — no login, no credit card.</p>
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Download className="h-4 w-4" />
            Download Free Template
          </Button>
        </div>

        {/* Contract example */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">Cleaning Contract Example</h2>
        <p className="mb-4 text-muted-foreground">Here&apos;s a simplified example of what a completed cleaning contract looks like:</p>
        <div className="mb-8 rounded-xl border border-border bg-card p-6 font-mono text-sm leading-relaxed text-foreground space-y-2">
          <p><span className="text-muted-foreground">Client:</span> ___________________________</p>
          <p><span className="text-muted-foreground">Service Address:</span> ___________________________</p>
          <p><span className="text-muted-foreground">Services:</span> Standard residential cleaning</p>
          <p><span className="text-muted-foreground">Schedule:</span> Weekly</p>
          <p><span className="text-muted-foreground">Price:</span> $200 per visit</p>
          <p><span className="text-muted-foreground">Payment Terms:</span> Due upon completion</p>
          <p><span className="text-muted-foreground">Cancellation Policy:</span> 24-hour notice required</p>
          <p><span className="text-muted-foreground">Signature:</span> ___________________________</p>
        </div>

        {/* Why you need one */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">Why You Need a Cleaning Contract</h2>
        <ul className="mb-8 space-y-2 text-muted-foreground">
          {[
            "Prevents misunderstandings with clients",
            "Protects your business legally",
            "Sets clear expectations upfront",
            "Makes your business look professional",
          ].map(item => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {/* Calculator link */}
        <div className="mb-10 rounded-2xl border border-border bg-card p-6">
          <p className="mb-1 font-semibold text-foreground">Want to generate accurate quotes to go with your contract?</p>
          <p className="mb-4 text-sm text-muted-foreground">Use our free cleaning calculator to price every job with confidence.</p>
          <Link href="/cleaning-estimate-calculator">
            <Button variant="outline" className="gap-2">
              Use Cleaning Calculator
            </Button>
          </Link>
        </div>

        {/* Final tip */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">Final Tip</h2>
        <p className="mb-10 text-muted-foreground leading-relaxed">
          The most successful cleaning businesses use both contracts and structured quoting systems. This combination protects your business and increases your revenue by setting professional expectations from the very first interaction.
        </p>

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-foreground">Ready to Protect Your Business?</h2>
          <p className="mb-5 text-muted-foreground">Download the free template and start using it with your very next client.</p>
          <Button size="lg" className="gap-2 px-8" onClick={() => setModalOpen(true)}>
            <Download className="h-4 w-4" />
            Download Free Cleaning Contract
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
