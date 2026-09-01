"use client"

import { useEffect, useState } from "react"
import { Mail, MessageSquare, RefreshCw, Send, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Invoice } from "@/app/actions/invoices"
import { exportInvoicePdf } from "@/lib/export-invoice-pdf"

export function SendInvoiceModal({ open, invoice, onClose }: { open: boolean; invoice: Invoice | null; onClose: () => void }) {
  const [method, setMethod] = useState<"email" | "text">("email")
  const [tone, setTone] = useState("Professional")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (invoice) setMessage(`Hi ${invoice.client_name || "there"},\n\nYour cleaning invoice is ready. The amount due is ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(invoice.amount_due)}${invoice.due_date ? `, due ${new Date(invoice.due_date).toLocaleDateString("en-US")}` : ""}. You can review the invoice and payment options at your convenience.\n\nThank you!`)
  }, [invoice])

  if (!invoice) return null
  const generate = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/quote-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientName: invoice.client_name, quoteName: invoice.invoice_title, homeAddress: invoice.home_address, generatedBy: "CleanQuote Pro", notes: `Invoice amount due: $${invoice.amount_due}. Payment link: ${invoice.stripe_payment_link ?? "not available"}`, tone }) })
      const result = await response.json()
      if (!response.ok) throw new Error()
      setMessage(result.message || message)
    } catch { toast.error("Could not generate a message right now.") } finally { setSaving(false) }
  }
  const send = () => {
    const destination = method === "email" ? invoice.client_email : invoice.client_phone
    if (!destination) return toast.error(`Add a client ${method === "email" ? "email" : "phone"} first.`)
    const subject = `Your Cleaning Invoice – ${invoice.invoice_title}`
    window.open(method === "email" ? `mailto:${destination}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}` : `sms:${destination}?body=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
  }
  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary"><Sparkles className="h-4 w-4" /> AI-assisted sending</div><DialogTitle>Send Invoice</DialogTitle><DialogDescription>Write a polished payment reminder and send the invoice to your client.</DialogDescription></DialogHeader><div className="flex flex-col gap-5"><div className="grid gap-2 sm:grid-cols-2">{([{ key: "email", Icon: Mail, label: "Email" }, { key: "text", Icon: MessageSquare, label: "Text" }] as const).map(({ key, Icon, label }) => <button key={key} type="button" onClick={() => setMethod(key)} className={`flex items-center gap-3 rounded-xl border p-4 text-left ${method === key ? "border-primary bg-primary/5" : "border-border"}`}><Icon className="h-5 w-5 text-primary" /><span className="font-semibold">{label}</span></button>)}</div><div className="flex flex-wrap gap-1">{["Professional", "Friendly", "Concise"].map((option) => <Button key={option} type="button" size="sm" variant={tone === option ? "secondary" : "ghost"} onClick={() => { setTone(option); void generate() }}>{option}</Button>)}</div><Textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-40" /><Button type="button" variant="ghost" className="self-start px-0 text-primary" onClick={generate} disabled={saving}><RefreshCw className="mr-2 h-4 w-4" /> Regenerate with AI</Button><div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={() => exportInvoicePdf(invoice)}>Download Invoice PDF</Button><Button type="button" onClick={send}><Send className="mr-2 h-4 w-4" />{method === "email" ? "Send Email" : "Open Messages"}</Button></div></div></DialogContent></Dialog>
}
