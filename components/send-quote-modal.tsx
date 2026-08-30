"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, MessageSquare, Mail, Save } from "lucide-react"
import { PhoneInput } from "@/components/phone-input"
import { toast } from "sonner"
import { updateQuote } from "@/app/actions/quotes"
import { getClientContacts } from "@/app/actions/contacts"
import type { ClientContact } from "@/lib/contacts-types"
import { COMPANY_NAME, EMAIL_FOOTER_TEXT, WEBSITE_URL, SUPPORT_EMAIL } from "@/lib/company-config"

export interface SendQuoteData {
  quoteId?: string | null
  quoteName: string
  homeAddress: string
  clientName?: string | null
  clientEmail?: string | null
  clientPhone?: string | null
  generatedBy?: string | null
  notes?: string | null
  resultStandard: number
  resultDeepClean: number
  resultMoveIn: number
  resultMonthly: number
  resultBiweekly: number
  resultWeekly: number
  createdAt?: string
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n ?? 0)
}

function buildEmailDraft(data: SendQuoteData, contact: ContactDraft): string {
  const to = contact.clientEmail || ""
  const clientGreeting = contact.clientName ? `Hi ${contact.clientName},` : "Hi there,"
  return `To: ${to}
Subject: Your Cleaning Quote – ${data.quoteName}

${clientGreeting}

Thank you for your interest! Please find your personalized cleaning quote below.

────────────────────────────
${COMPANY_NAME} — Quote Summary
────────────────────────────

Quote: ${data.quoteName}
Address: ${data.homeAddress}${contact.clientName ? `\nPrepared for: ${contact.clientName}` : ""}

PRICING OPTIONS
─────────────────────────────
One-Time Services:
  • Standard Clean:       ${fmt(data.resultStandard)}
  • Deep Clean:           ${fmt(data.resultDeepClean)}
  • Move In / Move Out:   ${fmt(data.resultMoveIn)}

Recurring Services:
  • Monthly:     ${fmt(data.resultMonthly)} / visit
  • Bi-weekly:   ${fmt(data.resultBiweekly)} / visit
  • Weekly:      ${fmt(data.resultWeekly)} / visit
${data.notes ? `\nNotes:\n${data.notes}` : ""}
────────────────────────────

This quote was generated with ${COMPANY_NAME}. Prices are estimates based on your home details and may vary.

Please reply to this email or call us to book your service.

Best regards,
${contact.generatedBy || COMPANY_NAME}

────────────────────────────
${EMAIL_FOOTER_TEXT}
${WEBSITE_URL.replace('https://', '')} · ${SUPPORT_EMAIL}`
}

function buildSmsDraft(data: SendQuoteData, contact: ContactDraft): string {
  return `Hi${contact.clientName ? ` ${contact.clientName}` : ""}! Here's your cleaning quote for ${data.homeAddress}:

• Standard: ${fmt(data.resultStandard)}
• Deep Clean: ${fmt(data.resultDeepClean)}
• Move In/Out: ${fmt(data.resultMoveIn)}
• Monthly: ${fmt(data.resultMonthly)}/visit

Reply to book your service! — ${contact.generatedBy || COMPANY_NAME}`
}

interface ContactDraft {
  generatedBy: string
  clientName: string
  clientEmail: string
  clientPhone: string
}

export function SendQuoteModal({
  open,
  onClose,
  data,
  onContactSaved,
}: {
  open: boolean
  onClose: () => void
  data: SendQuoteData | null
  onContactSaved?: (updated: Partial<SendQuoteData>) => void
}) {
  const [contact, setContact] = useState<ContactDraft>({
    generatedBy: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
  })
  const [saving, setSaving] = useState(false)
  const [clientContacts, setClientContacts] = useState<ClientContact[]>([])
  const [contactsLoaded, setContactsLoaded] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const loadContacts = async () => {
    if (contactsLoaded) return
    const contacts = await getClientContacts()
    setClientContacts(contacts.filter(contact => contact.is_active !== false))
    setContactsLoaded(true)
  }

  const matchingContacts = clientContacts.filter(savedContact =>
    savedContact.name.toLowerCase().includes(contact.clientName.toLowerCase())
  ).slice(0, 6)

  useEffect(() => {
    if (data) {
      setContact({
        generatedBy: data.generatedBy ?? "",
        clientName: data.clientName ?? "",
        clientEmail: data.clientEmail ?? "",
        clientPhone: data.clientPhone ?? "",
      })
    }
  }, [data])

  if (!data) return null

  const handleSaveContact = async () => {
    if (!data.quoteId) {
      toast.error("Save the quote first before updating contact details.")
      return
    }
    setSaving(true)
    const { error } = await updateQuote(data.quoteId, {
      quote_generated_by: contact.generatedBy || undefined,
      client_name: contact.clientName || undefined,
      client_email: contact.clientEmail || undefined,
      client_phone: contact.clientPhone || undefined,
    })
    setSaving(false)
    if (error) {
      toast.error("Failed to save contact details.")
      return
    }
    toast.success("Quote contact saved")
    onContactSaved?.({
      generatedBy: contact.generatedBy,
      clientName: contact.clientName,
      clientEmail: contact.clientEmail,
      clientPhone: contact.clientPhone,
    })
  }

  const handleCopyEmailDraft = async () => {
    const draft = buildEmailDraft(data, contact)
    await navigator.clipboard.writeText(draft)
    toast.success("Email draft copied — paste it into your email client")
    onClose()
  }

  const handleCopyQuoteSummary = async () => {
    const sms = buildSmsDraft(data, contact)
    await navigator.clipboard.writeText(sms)
    toast.success("Quote summary copied")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Quote
          </DialogTitle>
          <DialogDescription>
            Fill in or update the contact details, then copy the email draft or text summary.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Editable contact fields */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Quote Contact</p>
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sq-generated-by" className="text-sm text-muted-foreground">Generated By</Label>
                <Input
                  id="sq-generated-by"
                  value={contact.generatedBy}
                  onChange={e => setContact(c => ({ ...c, generatedBy: e.target.value }))}
                  placeholder="Your name or company"
                  className="h-8 text-sm"
                />
              </div>
              <div className="relative flex flex-col gap-1.5">
                <Label htmlFor="sq-client-name" className="text-sm text-muted-foreground">Client Name</Label>
                <Input
                  id="sq-client-name"
                  value={contact.clientName}
                  onFocus={() => { void loadContacts(); setShowSuggestions(true) }}
                  onChange={e => { setContact(c => ({ ...c, clientName: e.target.value })); setShowSuggestions(true); void loadContacts() }}
                  onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Start typing a client name"
                  className="h-8 text-sm"
                  autoComplete="off"
                />
                {showSuggestions && contact.clientName.trim() && matchingContacts.length > 0 && (
                  <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md" role="listbox" aria-label="Client contacts">
                    {matchingContacts.map(client => (
                      <button key={client.id} type="button" className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent" onMouseDown={event => event.preventDefault()} onClick={() => { setContact(c => ({ ...c, clientName: client.name, clientEmail: client.email ?? "", clientPhone: client.phone ?? "" })); setShowSuggestions(false) }}>
                        <span className="font-medium text-foreground">{client.name}</span>
                        <span className="text-xs text-muted-foreground">{[client.email, client.phone].filter(Boolean).join(" · ") || "No email or phone saved"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sq-client-email" className="text-sm text-muted-foreground">Client Email</Label>
                <Input
                  id="sq-client-email"
                  type="email"
                  value={contact.clientEmail}
                  onChange={e => setContact(c => ({ ...c, clientEmail: e.target.value }))}
                  placeholder="client@example.com"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sq-client-phone" className="text-sm text-muted-foreground">Client Phone</Label>
                <PhoneInput
                  id="sq-client-phone"
                  value={contact.clientPhone}
                  onChange={v => setContact(c => ({ ...c, clientPhone: v }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSaveContact}
              disabled={saving || !data.quoteId}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Quote Contact and Email"}
            </Button>
            {!data.quoteId && (
              <p className="text-xs text-muted-foreground text-center">
                Save the quote first to persist contact details.
              </p>
            )}
          </div>

          {/* How it works */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How it works</p>
            <p><strong>Copy Email Draft</strong> — Copies a polished email draft to your clipboard. Paste it into Gmail, Outlook, or any email client.</p>
            <p><strong>Copy Quote Summary</strong> — Copies a short text-message-style summary for SMS or messaging apps.</p>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCopyQuoteSummary}>
              <MessageSquare className="mr-1.5 h-4 w-4" />
              Copy Quote Summary
            </Button>
            <Button type="button" onClick={handleCopyEmailDraft}>
              <Mail className="mr-1.5 h-4 w-4" />
              Copy Email Draft
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
