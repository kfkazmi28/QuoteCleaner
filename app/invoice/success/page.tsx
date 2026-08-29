"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"

function SuccessContent() {
  const params = useSearchParams()
  const invoiceId = params.get("invoice_id")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payment Received</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you — the invoice has been paid successfully.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard/invoices">View Invoices</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

export default function InvoiceSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
