"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

function PrintQuote() {
  const params = useSearchParams()

  const name      = params.get("name")      ?? "Quote"
  const address   = params.get("address")   ?? ""
  const clientName   = params.get("clientName")
  const clientEmail  = params.get("clientEmail")
  const clientPhone  = params.get("clientPhone")
  const generatedBy  = params.get("generatedBy")
  const notes        = params.get("notes")
  const dateRaw      = params.get("date")

  const standard  = parseFloat(params.get("standard")  ?? "0")
  const deep      = parseFloat(params.get("deep")      ?? "0")
  const movein    = parseFloat(params.get("movein")    ?? "0")
  const monthly   = parseFloat(params.get("monthly")   ?? "0")
  const biweekly  = parseFloat(params.get("biweekly")  ?? "0")
  const weekly    = parseFloat(params.get("weekly")    ?? "0")

  const dateStr = dateRaw
    ? new Date(dateRaw).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  useEffect(() => {
    // Give the browser a tick to render before triggering print
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* Print-only global styles injected via a style tag */}
      <style>{`
        @media print {
          @page { size: letter; margin: 0.6in 0.65in; }
          body  { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
      `}</style>

      {/* Print button — hidden when actually printing */}
      <div className="no-print fixed bottom-6 right-6 flex gap-3 z-50">
        <button
          onClick={() => window.print()}
          style={{
            background: "#0d9488",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Save as PDF / Print
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: "#f1f5f9",
            color: "#475569",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      {/* Quote document */}
      <div
        style={{
          maxWidth: "720px",
          margin: "40px auto",
          padding: "0 24px 60px",
          color: "#111827",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#0d9488",
            borderRadius: "10px",
            padding: "28px 32px",
            marginBottom: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#fff", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.3px" }}>
              {generatedBy || "CleanQuote Pro"}
            </div>
            <div style={{ color: "#99f6e4", fontSize: "12px", marginTop: "2px" }}>
              Professional Cleaning Estimate
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: "11px", opacity: 0.85 }}>Date</div>
            <div style={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}>{dateStr}</div>
          </div>
        </div>

        {/* Quote title */}
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px" }}>{name}</h1>
        <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 24px", display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "12px" }}>&#128205;</span> {address}
        </p>

        <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0 0 24px" }} />

        {/* Client info */}
        {(clientName || clientEmail || clientPhone) && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#0d9488", textTransform: "uppercase", marginBottom: "10px" }}>
              Client Info
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
              {clientName  && <InfoRow label="Name"  value={clientName} />}
              {clientEmail && <InfoRow label="Email" value={clientEmail} />}
              {clientPhone && <InfoRow label="Phone" value={clientPhone} />}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#0d9488", textTransform: "uppercase", marginBottom: "12px" }}>
          Pricing Estimate
        </div>

        {/* One-time */}
        <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "16px 20px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
            One-Time Services
          </div>
          <PriceRow label="Standard Clean"      value={fmt(standard)} />
          <PriceRow label="Deep Clean"           value={fmt(deep)} />
          <PriceRow label="Move In / Move Out"   value={fmt(movein)} last />
        </div>

        {/* Recurring */}
        <div style={{ background: "#f0fdfa", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
            Recurring Services (per visit)
          </div>
          <PriceRow label="Monthly"   value={fmt(monthly)} />
          <PriceRow label="Bi-Weekly" value={fmt(biweekly)} />
          <PriceRow label="Weekly"    value={fmt(weekly)} last />
        </div>

        {/* Notes */}
        {notes && (
          <>
            <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0 0 20px" }} />
            <div style={{ marginBottom: "28px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#0d9488", textTransform: "uppercase", marginBottom: "8px" }}>
                Notes
              </div>
              <p style={{ color: "#4b5563", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>{notes}</p>
            </div>
          </>
        )}

        {/* Footer */}
        <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0 0 16px" }} />
        <p style={{ color: "#9ca3af", fontSize: "11px", textAlign: "center", margin: 0 }}>
          Generated by {generatedBy || "CleanQuote Pro"} &middot; Prices are estimates and may vary based on final home inspection.
        </p>
      </div>
    </>
  )
}

function PriceRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: last ? 0 : "8px",
        marginBottom: last ? 0 : "8px",
        borderBottom: last ? "none" : "1px solid #e5e7eb",
      }}
    >
      <span style={{ color: "#374151", fontSize: "13px" }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{value}</span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: "#9ca3af", fontSize: "11px" }}>{label}: </span>
      <span style={{ color: "#374151", fontSize: "13px" }}>{value}</span>
    </div>
  )
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "#6b7280" }}>Loading quote...</div>}>
      <PrintQuote />
    </Suspense>
  )
}
