"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  CalendarDays,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react"
import { createInvoice } from "@/app/actions/invoices"
import { createInvoiceCheckoutSession } from "@/app/actions/stripe"
import { getStripeConnectStatus, type StripeConnectStatus } from "@/app/actions/stripe-connect"
import { toast } from "sonner"
import Link from "next/link"

export interface InvoiceQuoteData {
  id: string
  quote_name: string
  client_name?: string | null
  client_email?: string | null
  client_phone?: string | null
  home_address?: string
  result_standard?: number
  result_deep_clean?: number
  result_move_in?: number
  preferred_package?: string | null
}

interface Props {
  quote: InvoiceQuoteData | null
  onClose: () => void
  onCreated: (invoiceId: string) => void
}

type DepositType = "full" | "deposit" | "custom"

export function CreateInvoiceModal({ quote, onClose, onCreated }: Props) {
  const [invoiceTitle, setInvoiceTitle] = useState("")
  const [amountTotal, setAmountTotal] = useState("")
  const [amountDue, setAmountDue] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [depositType, setDepositType] = useState<DepositType>("full")
  const [customAmount, setCustomAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null)

  // Resolve default price from quote
  const defaultPrice = (() => {
    if (!quote) return 0
    if (quote.preferred_package === "deep") return quote.result_deep_clean ?? 0
    if (quote.preferred_package === "move") return quote.result_move_in ?? 0
    return quote.result_standard ?? quote.result_deep_clean ?? quote.result_move_in ?? 0
  })()

  useEffect(() => {
    getStripeConnectStatus().then(setConnectStatus)
  }, [])

  useEffect(() => {
    if (quote) {
      setInvoiceTitle(`Invoice — ${quote.quote_name}`)
      setAmountTotal(defaultPrice > 0 ? defaultPrice.toFixed(2) : "")
      setAmountDue(defaultPrice > 0 ? defaultPrice.toFixed(2) : "")
      setDepositType("full")
      setCustomAmount("")
      setDueDate("")
      setNotes("")
    }
  }, [quote])

  useEffect(() => {
    const total = parseFloat(amountTotal) || 0
    if (depositType === "full") {
      setAmountDue(amountTotal)
    } else if (depositType === "deposit") {
      setAmountDue((total * 0.5).toFixed(2))
    } else if (depositType === "custom") {
      setAmountDue(customAmount)
    }
  }, [depositType, amountTotal, customAmount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quote) return
    const total = parseFloat(amountTotal)
    const due = parseFloat(amountDue)
    if (!invoiceTitle.trim() || isNaN(total) || isNaN(due) || due <= 0) {
      toast.error("Please fill in all required fields")
      return
    }

    setSaving(true)
    const { data: invoice, error } = await createInvoice({
      quote_id: quote.id,
      client_name: quote.client_name ?? undefined,
      client_email: quote.client_email ?? undefined,
      client_phone: quote.client_phone ?? undefined,
      home_address: quote.home_address,
      invoice_title: invoiceTitle.trim(),
      amount_total: total,
      amount_due: due,
      due_date: dueDate || undefined,
      notes: notes.trim() || undefined,
    })

    if (error || !invoice) {
      toast.error(error ?? "Failed to create invoice")
      setSaving(false)
      return
    }

    // Create Stripe checkout session
    const { url, error: stripeError } = await createInvoiceCheckoutSession({
      invoiceId: invoice.id,
      quoteId: quote.id,
      invoiceTitle: invoiceTitle.trim(),
      amountDue: due,
    })

    setSaving(false)

    if (stripeError) {
      toast.warning("Invoice created but payment link failed: " + stripeError)
    } else {
      toast.success("Invoice created with payment link")
    }

    onCreated(invoice.id)
  }

  if (!quote) return null

  const totalNum = parseFloat(amountTotal) || 0

  return (
    <Dialog open={!!quote} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            Create Invoice
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {quote.home_address}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Quote summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Quote Details</p>
              <p className="text-sm font-semibold text-foreground">{quote.quote_name}</p>
              {quote.client_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  {quote.client_name}
                </div>
              )}
              {quote.client_email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {quote.client_email}
                </div>
              )}
              {quote.client_phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {quote.client_phone}
                </div>
              )}
            </div>

            {/* Stripe Connect status banner */}
            {connectStatus && (
              connectStatus.chargesEnabled ? (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm text-primary font-medium">Payment processing: Connected</p>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Stripe not connected</p>
                    <p className="text-xs text-muted-foreground">
                      Connect your Stripe account in{" "}
                      <Link href="/account" className="underline text-primary">Account settings</Link>{" "}
                      before sending payment links.
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Invoice title */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-title">Invoice Title <span className="text-destructive">*</span></Label>
              <Input
                id="inv-title"
                value={invoiceTitle}
                onChange={(e) => setInvoiceTitle(e.target.value)}
                placeholder="Invoice — Client Name"
                required
              />
            </div>

            {/* Amount total */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-total">Total Amount <span className="text-destructive">*</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inv-total"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-9"
                  value={amountTotal}
                  onChange={(e) => setAmountTotal(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Deposit option */}
            <div className="space-y-2">
              <Label>Amount Due</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "full", label: "Full Amount" },
                  { key: "deposit", label: "50% Deposit" },
                  { key: "custom", label: "Custom" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDepositType(opt.key as DepositType)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      depositType === opt.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {depositType === "custom" && (
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-9"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Custom amount due"
                  />
                </div>
              )}

              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount to charge client</span>
                <span className="text-lg font-bold text-primary">
                  ${(parseFloat(amountDue) || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-due" className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                Due Date
              </Label>
              <Input
                id="inv-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea
                id="inv-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes for the client..."
                rows={3}
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
