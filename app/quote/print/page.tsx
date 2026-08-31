"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

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
        .editable { outline: 1px dashed rgba(13,148,136,.45); outline-offset: 3px; cursor: text; }
        @media print { .editable { outline: none; cursor: default; } }
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
          Save as PDF
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
        {/* Selected service and price */}
        <div style={{ background: "#f0fdfa", borderRadius: "8px", padding: "24px 28px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}><strong contentEditable suppressContentEditableWarning className="editable" style={{ fontSize: "22px" }}>{name}</strong><strong contentEditable suppressContentEditableWarning className="editable" style={{ fontSize: "26px" }}>{fmt(parseFloat(params.get("price") ?? "0"))}</strong></div>
        </div>

      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: "24px" }}><div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#0d9488", textTransform: "uppercase", marginBottom: "10px" }}>{title}</div><div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px 20px" }}>{children}</div></div>
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

function InfoRow({ label, value, editable = false }: { label: string; value: string; editable?: boolean }) {
  return (
    <div>
      <span style={{ color: "#9ca3af", fontSize: "11px" }}>{label}: </span>
      <span contentEditable={editable} suppressContentEditableWarning className={editable ? "editable" : undefined} style={{ color: "#374151", fontSize: "13px" }}>{value}</span>
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
