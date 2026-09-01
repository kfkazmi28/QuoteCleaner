"use client"

import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QuoteCalculator } from "@/components/quote-calculator"

interface CalculatorDialogProps {
  /** The element that opens the calculator. Must accept a ref/onClick (Button, Link, button). */
  children: ReactNode
}

export function CalculatorDialog({ children }: CalculatorDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] w-[min(96vw,900px)] max-w-none overflow-y-auto p-0 sm:max-w-none">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6 text-left">
          <DialogTitle className="text-balance text-2xl font-bold tracking-tight">
            Create your free cleaning quote
          </DialogTitle>
          <DialogDescription className="text-pretty">
            Enter the home details below to generate an instant estimate.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-6 sm:px-6">
          <QuoteCalculator />
        </div>
      </DialogContent>
    </Dialog>
  )
}
