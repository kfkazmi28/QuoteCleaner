import { NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export async function GET() {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const teal = rgb(0.18, 0.62, 0.58)
  const dark = rgb(0.12, 0.12, 0.12)
  const gray = rgb(0.45, 0.45, 0.45)
  const lineGray = rgb(0.8, 0.8, 0.8)

  const margin = 60
  const pageWidth = 612
  const pageHeight = 792
  const contentWidth = pageWidth - margin * 2

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const newPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    y = pageHeight - margin
  }

  const checkY = (needed: number) => {
    if (y - needed < margin + 40) newPage()
  }

  const drawLine = (color = lineGray, thickness = 0.5) => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness,
      color,
    })
    y -= 8
  }

  const drawText = (text: string, opts: { size?: number; font?: typeof font; color?: ReturnType<typeof rgb>; x?: number; indent?: number } = {}) => {
    const size = opts.size ?? 11
    const f = opts.font ?? font
    const color = opts.color ?? dark
    const x = opts.x ?? (opts.indent ? margin + opts.indent : margin)
    page.drawText(text, { x, y, size, font: f, color })
    y -= size + 6
  }

  const drawField = (label: string, lines = 1) => {
    checkY(lines * 22 + 20)
    drawText(label, { size: 9, color: gray })
    for (let i = 0; i < lines; i++) {
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 0.75,
        color: lineGray,
      })
      y -= 20
    }
    y -= 4
  }

  const drawSection = (title: string) => {
    checkY(40)
    y -= 8
    page.drawRectangle({ x: margin, y: y - 4, width: contentWidth, height: 20, color: rgb(0.92, 0.97, 0.96) })
    drawText(title.toUpperCase(), { size: 10, font: bold, color: teal })
    y -= 4
  }

  // ── Header ──────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: pageHeight - 80, width: pageWidth, height: 80, color: teal })
  page.drawText("Cleaning Service Agreement", { x: margin, y: pageHeight - 48, size: 22, font: bold, color: rgb(1, 1, 1) })
  page.drawText("Professional Contract Template", { x: margin, y: pageHeight - 68, size: 11, font, color: rgb(0.85, 0.97, 0.95) })
  y = pageHeight - 104

  drawText("This agreement is entered into between the Service Provider and the Client listed below.", { size: 10, color: gray })
  y -= 4
  drawLine(teal, 1)
  y -= 4

  // ── 1. Client Information ───────────────────────────────────────────────
  drawSection("1. Client Information")
  drawField("Client Full Name")
  drawField("Client Address")
  drawField("City, State, ZIP")
  drawField("Phone Number")
  drawField("Email Address")

  // ── 2. Service Provider Information ────────────────────────────────────
  drawSection("2. Service Provider Information")
  drawField("Business / Provider Name")
  drawField("Contact Person")
  drawField("Phone Number")
  drawField("Email Address")
  drawField("Business Address")

  // ── 3. Service Address ──────────────────────────────────────────────────
  drawSection("3. Service Address")
  drawField("Property Address")
  drawField("City, State, ZIP")
  drawField("Access Instructions / Gate Code", 2)

  // ── 4. Scope of Services ────────────────────────────────────────────────
  drawSection("4. Scope of Services")
  const services = [
    "  General cleaning (dusting, vacuuming, mopping)",
    "  Kitchen cleaning (surfaces, appliances, sink)",
    "  Bathroom cleaning (toilets, sinks, showers, tubs)",
    "  Bedroom and living areas",
    "  Other (specify below)",
  ]
  for (const s of services) {
    checkY(18)
    page.drawRectangle({ x: margin, y: y - 2, width: 10, height: 10, borderColor: lineGray, borderWidth: 0.75 })
    drawText(s, { size: 10, color: dark, indent: 18 })
  }
  drawField("Additional Details", 2)

  // ── 5. Schedule and Frequency ───────────────────────────────────────────
  drawSection("5. Schedule and Frequency")
  drawField("Start Date")
  drawField("Frequency (weekly / bi-weekly / monthly / one-time)")
  drawField("Preferred Day(s) and Time")

  // ── 6. Pricing and Payment Terms ────────────────────────────────────────
  drawSection("6. Pricing and Payment Terms")
  drawField("Rate Per Visit  $")
  drawField("Payment Method (cash / check / card / Venmo / Zelle)")
  drawField("Payment Due Date")
  drawField("Late Fee Policy")

  // ── 7. Cancellation Policy ──────────────────────────────────────────────
  drawSection("7. Cancellation Policy")
  checkY(50)
  drawText("Client must provide at least 24 hours notice to cancel or reschedule. Cancellations with less than", { size: 10, color: gray })
  drawText("24 hours notice may be subject to a cancellation fee of:", { size: 10, color: gray })
  drawField("Cancellation Fee  $")

  // ── 8. Property Access ──────────────────────────────────────────────────
  drawSection("8. Property Access")
  drawField("Key / Code Provided?  (Yes / No)")
  drawField("Entry Instructions")

  // ── 9. Supplies and Equipment ───────────────────────────────────────────
  drawSection("9. Supplies and Equipment")
  checkY(40)
  drawText("Cleaning supplies and equipment will be provided by:", { size: 10, color: gray })
  drawField("(Client / Service Provider / Both — circle one)")

  // ── 10. Damages and Liability ────────────────────────────────────────────
  drawSection("10. Damages and Liability")
  checkY(60)
  drawText("The Service Provider will exercise due care while on the premises. The Provider is not responsible", { size: 10, color: gray })
  drawText("for pre-existing damage. Any damage caused during service will be reported immediately.", { size: 10, color: gray })
  y -= 4
  drawField("Insurance Coverage (if any)")

  // ── 11. Agreement and Signatures ────────────────────────────────────────
  drawSection("11. Agreement and Signatures")
  checkY(120)
  drawText("By signing below, both parties agree to the terms outlined in this agreement.", { size: 10, color: gray })
  y -= 8

  const col2 = margin + contentWidth / 2 + 10
  const sigWidth = contentWidth / 2 - 20

  page.drawText("Client Signature", { x: margin, y, size: 9, font, color: gray })
  page.drawText("Service Provider Signature", { x: col2, y, size: 9, font, color: gray })
  y -= 20
  page.drawLine({ start: { x: margin, y }, end: { x: margin + sigWidth, y }, thickness: 0.75, color: lineGray })
  page.drawLine({ start: { x: col2, y }, end: { x: col2 + sigWidth, y }, thickness: 0.75, color: lineGray })
  y -= 20
  page.drawText("Printed Name", { x: margin, y, size: 9, font, color: gray })
  page.drawText("Printed Name", { x: col2, y, size: 9, font, color: gray })
  y -= 20
  page.drawLine({ start: { x: margin, y }, end: { x: margin + sigWidth, y }, thickness: 0.75, color: lineGray })
  page.drawLine({ start: { x: col2, y }, end: { x: col2 + sigWidth, y }, thickness: 0.75, color: lineGray })
  y -= 20
  page.drawText("Date", { x: margin, y, size: 9, font, color: gray })
  page.drawText("Date", { x: col2, y, size: 9, font, color: gray })
  y -= 20
  page.drawLine({ start: { x: margin, y }, end: { x: margin + sigWidth / 2, y }, thickness: 0.75, color: lineGray })
  page.drawLine({ start: { x: col2, y }, end: { x: col2 + sigWidth / 2, y }, thickness: 0.75, color: lineGray })

  // ── Footer on all pages ─────────────────────────────────────────────────
  const pages = pdfDoc.getPages()
  for (const p of pages) {
    p.drawLine({ start: { x: margin, y: 40 }, end: { x: pageWidth - margin, y: 40 }, thickness: 0.5, color: lineGray })
    p.drawText("Provided by CleanQuote Pro — Professional cleaning quote software", {
      x: margin, y: 24, size: 8, font, color: gray,
    })
  }

  const pdfBytes = await pdfDoc.save()
  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="cleaning-contract-template.pdf"',
      "Cache-Control": "public, max-age=86400",
    },
  })
}
