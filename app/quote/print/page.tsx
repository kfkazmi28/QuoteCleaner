"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

function formatLabel(label: string) {
  return label.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())
}

function PrintQuote() {
  const params = useSearchParams()
  const name = params.get("name") ?? "Cleaning Estimate"
  const price = Number(params.get("price") ?? 0)
  const address = params.get("address") ?? ""
  const clientName = params.get("clientName") ?? ""
  const clientEmail = params.get("clientEmail") ?? ""
  const clientPhone = params.get("clientPhone") ?? ""
  const notes = params.get("notes") ?? ""
  const generatedBy = params.get("generatedBy") ?? ""
  const homeVariables = JSON.parse(params.get("homeVariables") ?? "{}") as Record<string, string | number | null>
  const checklist = JSON.parse(params.get("checklist") ?? "[]") as { section: string; items: string[] }[]
  const estimateNumber = params.get("quoteId") || "10023"

  return (
    <>
      <style>{`
        @page { size: letter; margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #eef8f6; font-family: Arial, Helvetica, sans-serif; color: #132238; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print { body { background: #fff; } .no-print { display: none !important; } .quote-page { box-shadow: none !important; } }
        .editable { outline: 1px dashed rgba(13,148,136,.45); outline-offset: 3px; }
        @media print { .editable { outline: none; } }
      `}</style>
      <div className="no-print" style={{ position: "fixed", zIndex: 20, right: 24, bottom: 24, display: "flex", gap: 10 }}>
        <button onClick={() => window.print()} style={buttonStyle}>Save as PDF</button>
        <button onClick={() => window.close()} style={{ ...buttonStyle, background: "#e8f1f0", color: "#31505a" }}>Close</button>
      </div>

      <main className="quote-page" style={{ position: "relative", overflow: "hidden", width: "8.5in", minHeight: "11in", margin: "0 auto", padding: "0.46in 0.47in 0.35in", background: "#fff", boxShadow: "0 12px 40px rgba(19,34,56,.14)" }}>
        <div style={{ position: "relative" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ width: 51, height: 51, borderRadius: 12, display: "grid", placeItems: "center", background: "#008f78", color: "white", fontSize: 15, fontWeight: 800, letterSpacing: -.5 }}>CQ</div>
              <div><div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -.8 }}>CleanQuote <span style={{ color: "#008f78" }}>Pro</span></div><div style={{ marginTop: 2, fontSize: 9, letterSpacing: 1.5, color: "#71808b", fontWeight: 700 }}>PROFESSIONAL CLEANING ESTIMATE</div></div>
            </div>
            <div style={{ textAlign: "right", fontSize: 10, lineHeight: 1.8, color: "#5c6c7b" }}><strong style={{ color: "#008f78", fontSize: 12 }}>ESTIMATE #{estimateNumber}</strong><br />Date: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}<br />Valid for 30 days</div>
          </header>

          <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, padding: "22px 27px", marginBottom: 25, border: "1px solid #dbece9", borderRadius: 12, background: "rgba(239,249,247,.92)" }}>
            <div><div style={{ fontSize: 26, fontWeight: 800, marginBottom: 5 }}>{name}</div><div style={{ color: "#6b7d88", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Cleaning service estimate</div></div>
            <div style={{ textAlign: "right" }}><div style={{ color: "#008f78", fontSize: 31, fontWeight: 800 }}>{fmt(price)}</div><div style={{ color: "#6b7d88", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>ESTIMATED TOTAL</div></div>
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginBottom: 23 }}>
            {(clientName || address || clientEmail || clientPhone) && <Panel title="CLIENT INFORMATION"><InfoRow label="Name" value={clientName} />{clientEmail && <InfoRow label="Email" value={clientEmail} />}{clientPhone && <InfoRow label="Phone" value={clientPhone} />}{address && <InfoRow label="Address" value={address} />}</Panel>}
            {Object.keys(homeVariables).length > 0 && <Panel title="PROPERTY DETAILS">{Object.entries(homeVariables).filter(([, value]) => value !== null && value !== undefined && value !== "").map(([label, value]) => <InfoRow key={label} label={formatLabel(label)} value={String(value)} right />)}</Panel>}
          </div>

          {checklist.length > 0 && <Panel title="CLEANING CHECKLIST"><div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(checklist.length, 4)}, 1fr)`, gap: 17 }}>{checklist.map((section, index) => <div key={`${section.section}-${index}`}><div contentEditable suppressContentEditableWarning className="editable" style={{ marginBottom: 9, color: "#008f78", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{section.section}</div>{section.items.map((item, itemIndex) => <div key={`${item}-${itemIndex}`} contentEditable suppressContentEditableWarning className="editable" style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 10.5, lineHeight: 1.25 }}><span style={{ color: "#00a98f", fontWeight: 800 }}>✓</span>{item}</div>)}</div>)}</div></Panel>}
          {notes && <section style={{ marginTop: 16, padding: "13px 17px", border: "1px solid #dbece9", borderRadius: 10, background: "rgba(239,249,247,.82)" }}><div style={{ color: "#008f78", fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 7 }}>NOTES</div><div contentEditable suppressContentEditableWarning className="editable" style={{ color: "#6b7d88", fontSize: 11 }}>{notes}</div></section>}

          <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 25, marginTop: 28, paddingTop: 16, borderTop: "1px solid #dbece9" }}><div><div style={{ color: "#008f78", fontFamily: "cursive", fontSize: 28, fontStyle: "italic" }}>Thank you!</div><div style={{ marginTop: 5, color: "#71808b", fontSize: 10 }}>We appreciate the opportunity to earn your business.</div>{generatedBy && <div style={{ marginTop: 5, color: "#71808b", fontSize: 10 }}>Prepared by {generatedBy}</div>}</div><div style={{ padding: "13px 20px", border: "1px solid #dbece9", borderRadius: 10, background: "rgba(239,249,247,.82)", minWidth: 190 }}><div style={{ color: "#008f78", fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>QUESTIONS?</div>{clientPhone && <div style={{ fontSize: 10, marginBottom: 5 }}>☎ {clientPhone}</div>}{clientEmail && <div style={{ fontSize: 10, marginBottom: 5 }}>✉ {clientEmail}</div>}<div style={{ color: "#5c6c7b", fontSize: 10 }}>CleanQuote Pro</div></div></footer>
        </div>
      </main>
    </>
  )
}

const buttonStyle = { border: "none", borderRadius: 8, padding: "10px 18px", background: "#008f78", color: "white", fontWeight: 700, cursor: "pointer" }

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section style={{ padding: "16px 20px", border: "1px solid #dbece9", borderRadius: 10, background: "rgba(255,255,255,.9)" }}><div style={{ marginBottom: 13, color: "#008f78", fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>{title}</div>{children}</section> }
function InfoRow({ label, value, right = false }: { label: string; value: string; right?: boolean }) { return <div style={{ display: "flex", justifyContent: right ? "space-between" : "flex-start", gap: 12, marginBottom: 9, fontSize: 10.5 }}><span style={{ color: "#71808b" }}>{label}</span><span contentEditable suppressContentEditableWarning className="editable" style={{ color: "#132238", fontWeight: 600, textAlign: right ? "right" : "left" }}>{value}</span></div> }

export default function PrintPage() { return <Suspense fallback={<div style={{ padding: 40 }}>Loading quote...</div>}><PrintQuote /></Suspense> }
