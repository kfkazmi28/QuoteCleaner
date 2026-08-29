"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaywallModalProps {
  onClose: () => void
}

export function PaywallModal({ onClose }: PaywallModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-card-foreground">Unlock Unlimited Quotes</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Get unlimited cleaning estimates for only{" "}
            <strong className="text-foreground">$5/week</strong>. No commitment, cancel anytime.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/pricing">Upgrade Now</Link>
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
            Maybe Later
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Free plan allows 1 quote every 7 days
        </p>
      </div>
    </div>
  )
}
