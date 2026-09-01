import type { Invoice } from "@/app/actions/invoices"

export function exportInvoicePdf(invoice: Invoice): void {
  const params = new URLSearchParams({
    title: invoice.invoice_title,
    total: String(invoice.amount_total),
    due: String(invoice.amount_due),
    clientName: invoice.client_name ?? "",
    clientEmail: invoice.client_email ?? "",
    clientPhone: invoice.client_phone ?? "",
    address: invoice.home_address ?? "",
    dueDate: invoice.due_date ?? "",
    notes: invoice.notes ?? "",
    status: invoice.status,
    invoiceId: invoice.id.slice(0, 8).toUpperCase(),
  })
  window.open(`/invoice/print?${params.toString()}`, "_blank", "noopener,noreferrer")
}
