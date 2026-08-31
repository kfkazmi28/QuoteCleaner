"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  FileText,
  Copy,
  Check,
  ExternalLink,
  Send,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Receipt,
  Zap,
  CheckCircle2,
  LayoutGrid,
  List,
} from "lucide-react"
import { getInvoices, markInvoiceSent, cancelInvoice, type Invoice } from "@/app/actions/invoices"
import { checkInvoicesTableExists } from "@/app/actions/invoices"
import { getStripeConnectStatus, type StripeConnectStatus } from "@/app/actions/stripe-connect"
import { toast } from "sonner"

const STATUS_LABELS: Record<Invoice["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  canceled: "Canceled",
}

const STATUS_STYLES: Record<Invoice["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  paid: "bg-primary/10 text-primary",
  canceled: "bg-destructive/10 text-destructive",
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(val)
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : label}
    </Button>
  )
}

function InvoiceDetailModal({
  invoice,
  onClose,
  onMarkSent,
  onCancel,
  connectEnabled,
}: {
  invoice: Invoice | null
  onClose: () => void
  onMarkSent: (id: string) => void
  onCancel: (id: string) => void
  connectEnabled: boolean
}) {
  if (!invoice) return null

  const emailSubject = `Your Cleaning Invoice from CleanQuote`
  const emailBody = [
    `Hi ${invoice.client_name ?? "there"},`,
    ``,
    `Here is your cleaning invoice for services at:`,
    `${invoice.home_address ?? ""}`,
    ``,
    `Invoice: ${invoice.invoice_title}`,
    `Amount Due: ${formatCurrency(invoice.amount_due)}`,
    invoice.due_date ? `Due By: ${formatDate(invoice.due_date)}` : null,
    invoice.notes ? `\nNotes: ${invoice.notes}` : null,
    ``,
    invoice.stripe_payment_link
      ? `Pay Online: ${invoice.stripe_payment_link}`
      : null,
    ``,
    `Thank you for your business!`,
  ]
    .filter((l) => l !== null)
    .join("\n")

  return (
    <Dialog open={!!invoice} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{invoice.invoice_title}</DialogTitle>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[invoice.status]}`}>
              {STATUS_LABELS[invoice.status]}
            </span>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Created {formatDate(invoice.created_at)}
            {invoice.due_date && ` · Due ${formatDate(invoice.due_date)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Amount */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(invoice.amount_due)}</p>
            </div>
            {invoice.amount_total !== invoice.amount_due && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-base font-semibold text-foreground">{formatCurrency(invoice.amount_total)}</p>
              </div>
            )}
          </div>

          {/* Client info */}
          {(invoice.client_name || invoice.client_email || invoice.client_phone || invoice.home_address) && (
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Client</p>
              {invoice.client_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {invoice.client_name}
                </div>
              )}
              {invoice.client_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a href={`mailto:${invoice.client_email}`} className="text-primary hover:underline">
                    {invoice.client_email}
                  </a>
                </div>
              )}
              {invoice.client_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {invoice.client_phone}
                </div>
              )}
              {invoice.home_address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {invoice.home_address}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Notes</p>
              <p className="text-sm text-foreground whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Payment link + copy actions */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Send Invoice</p>
            {invoice.stripe_payment_link && connectEnabled ? (
              <div className="flex flex-wrap gap-2">
                <CopyButton text={invoice.stripe_payment_link} label="Copy Payment Link" />
                <CopyButton text={emailBody} label="Copy Email Message" />
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <a href={invoice.stripe_payment_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Checkout
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment link available.{" "}
                <Link href="/account" className="text-primary underline">Connect Stripe</Link>{" "}
                then re-create this invoice to generate a valid payment link.
              </p>
            )}
          </div>

          {/* Paid info */}
          {invoice.status === "paid" && invoice.paid_at && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-sm font-medium text-primary">
                Paid on {formatDate(invoice.paid_at)}
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {invoice.status === "draft" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onMarkSent(invoice.id); onClose() }}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Mark as Sent
              </Button>
            )}
            {invoice.status !== "canceled" && invoice.status !== "paid" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => { onCancel(invoice.id); onClose() }}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Cancel Invoice
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type TabKey = Invoice["status"] | "all"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [tableReady, setTableReady] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    getStripeConnectStatus().then(setConnectStatus)
    checkInvoicesTableExists().then((ready) => {
      setTableReady(ready)
      if (ready) {
        getInvoices().then((data) => {
          setInvoices(data)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })
  }, [])

  const handleMarkSent = async (id: string) => {
    const { error } = await markInvoiceSent(id)
    if (error) { toast.error("Failed to mark as sent"); return }
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: "sent" } : inv))
    toast.success("Invoice marked as sent")
  }

  const handleCancel = async (id: string) => {
    const { error } = await cancelInvoice(id)
    if (error) { toast.error("Failed to cancel invoice"); return }
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: "canceled" } : inv))
    toast.success("Invoice canceled")
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Sent" },
    { key: "paid", label: "Paid" },
    { key: "canceled", label: "Canceled" },
  ]

  const filtered = activeTab === "all"
    ? invoices
    : invoices.filter((inv) => inv.status === activeTab)

  const countByStatus = (s: Invoice["status"]) => invoices.filter((i) => i.status === s).length

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:ml-64">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track and manage client payment invoices
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-7 w-7 p-0 ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-7 w-7 p-0 ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/quotes">Go to Quotes</Link>
            </Button>
          </div>
        </div>

        {/* Stripe Connect banner */}
        {connectStatus && !connectStatus.chargesEnabled && (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-4 dark:border-yellow-800 dark:bg-yellow-950/30 flex items-start gap-3">
            <Zap className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {connectStatus.connected ? "Stripe setup incomplete" : "Connect Stripe to accept payments"}
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                Invoice payment links will only work after you connect your Stripe account.{" "}
                <Link href="/account" className="underline font-medium">
                  Go to Account settings
                </Link>
                {" "}to connect.
              </p>
            </div>
          </div>
        )}
        {connectStatus?.chargesEnabled && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-medium text-primary">Stripe Connected — invoice payments go directly to your account</p>
          </div>
        )}

        {/* Migration banner */}
        {tableReady === false && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-800 dark:bg-amber-950/30 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Database setup required</p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                Visit{" "}
                <a
                  href="/api/migrate/create-invoices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  /api/migrate/create-invoices
                </a>{" "}
                to get the SQL, then run it in your{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Supabase SQL editor
                </a>
                .
              </p>
            </div>
          </div>
        )}

        {/* Summary cards */}
        {tableReady && !loading && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Draft", count: countByStatus("draft"), color: "text-muted-foreground" },
              { label: "Sent", count: countByStatus("sent"), color: "text-blue-600 dark:text-blue-400" },
              { label: "Paid", count: countByStatus("paid"), color: "text-primary" },
              { label: "Canceled", count: countByStatus("canceled"), color: "text-destructive" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && !loading && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({countByStatus(tab.key as Invoice["status"])})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 w-2/3 rounded bg-muted" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !tableReady ? null : filtered.length === 0 ? (
          <Card className="flex min-h-[280px] flex-col items-center justify-center border-dashed text-center">
            <CardContent className="flex flex-col items-center gap-3 pt-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Receipt className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground">No invoices yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Open a saved quote, click the menu, and choose &quot;Convert to Invoice&quot; to create your first invoice.
              </p>
              <Button asChild size="sm" className="mt-2">
                <Link href="/dashboard/quotes">Go to Quotes</Link>
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((invoice) => (
              <Card
                key={invoice.id}
                className="flex flex-col transition-shadow hover:shadow-md cursor-pointer"
                onClick={() => setViewInvoice(invoice)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{invoice.invoice_title}</CardTitle>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[invoice.status]}`}>
                      {STATUS_LABELS[invoice.status]}
                    </span>
                  </div>
                  {invoice.client_name && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3 shrink-0" />
                      {invoice.client_name}
                    </div>
                  )}
                  {invoice.home_address && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{invoice.home_address}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Amount Due</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(invoice.amount_due)}</p>
                    </div>
                    {invoice.due_date && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Due</p>
                        <p className="text-sm font-medium text-foreground">{formatDate(invoice.due_date)}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(invoice.created_at)}
                    </div>
                    {invoice.stripe_payment_link && connectStatus?.chargesEnabled && (
                      <div
                        className="flex items-center gap-1 text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={invoice.stripe_payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Pay Link
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 border-b border-border bg-muted/40 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount Due</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Status</p>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((invoice) => (
                <div
                  key={invoice.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3.5 items-center hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setViewInvoice(invoice)}
                >
                  {/* Title + address */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{invoice.invoice_title}</p>
                    {invoice.home_address && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {invoice.home_address}
                      </p>
                    )}
                  </div>

                  {/* Client */}
                  <div className="min-w-0">
                    {invoice.client_name ? (
                      <p className="text-sm text-foreground truncate">{invoice.client_name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(invoice.amount_due)}</p>
                    {invoice.due_date && (
                      <p className="text-xs text-muted-foreground">Due {formatDate(invoice.due_date)}</p>
                    )}
                  </div>

                  {/* Created date */}
                  <div>
                    <p className="text-sm text-muted-foreground">{formatDate(invoice.created_at)}</p>
                  </div>

                  {/* Status + pay link */}
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[invoice.status]}`}>
                      {STATUS_LABELS[invoice.status]}
                    </span>
                    {invoice.stripe_payment_link && connectStatus?.chargesEnabled && (
                      <a
                        href={invoice.stripe_payment_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        Pay Link
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <InvoiceDetailModal
        invoice={viewInvoice}
        onClose={() => setViewInvoice(null)}
        onMarkSent={handleMarkSent}
        onCancel={handleCancel}
        connectEnabled={connectStatus?.chargesEnabled ?? false}
      />
    </div>
  )
}
