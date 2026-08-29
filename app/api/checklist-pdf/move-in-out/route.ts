import { NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

const PRIMARY = rgb(0.118, 0.565, 0.502)
const BLACK = rgb(0.1, 0.1, 0.1)
const GRAY = rgb(0.45, 0.45, 0.45)
const LIGHT = rgb(0.96, 0.98, 0.97)

const ITEMS = [
  // Kitchen
  "Clean inside oven completely — racks, glass, walls",
  "Degrease stovetop and all burner grates",
  "Clean inside refrigerator and wipe all shelves",
  "Defrost freezer and wipe dry",
  "Clean inside dishwasher — filter, door seal, interior",
  "Wipe inside all kitchen cabinets and drawers",
  "Clean exhaust hood, filter, and fan",
  "Scrub sink and disinfect drain",
  "Degrease all countertops and backsplash",
  "Sweep and mop kitchen floor",
  // Bathrooms
  "Scrub toilet inside and out including base and tank",
  "Clean tub and shower walls with mold-killing cleaner",
  "Scrub tile grout lines on floor and walls",
  "Clean vanity, sink, and all fixtures",
  "Wipe inside all bathroom cabinets and drawers",
  "Clean mirror and all glass surfaces",
  "Wash or remove shower curtain and liner",
  "Clean exhaust fan cover and blades",
  "Disinfect all surfaces with hospital-grade product",
  "Sweep and mop bathroom floor",
  // Bedrooms & Living Areas
  "Vacuum and scrub all carpets",
  "Mop all hard floors thoroughly",
  "Wash all baseboards throughout",
  "Clean inside all closets — walls, shelves, floor",
  "Wipe all walls for scuffs and marks",
  "Clean all window tracks and frames",
  "Wipe all blinds — individual slats",
  "Dust all ceiling fans and light fixtures",
  "Clean all light switches and outlet covers",
  "Remove any nails, anchors, or wall patches visible",
  // Windows & Doors
  "Clean all interior windows both sides",
  "Wipe all window sills and ledges",
  "Clean all interior door surfaces and handles",
  "Wipe all door frames and tops",
  "Clean sliding glass door tracks",
  "Clean front door — inside and outside",
  "Clean garage door — interior side",
  "Wipe all exterior-facing glass panels",
  "Dust all vents and air return covers",
  "Clean inside laundry room — all surfaces",
  // Final
  "Vacuum all carpet edges and corners",
  "Clean inside garage if applicable",
  "Remove all debris and trash",
  "Check all light switches function",
  "Document any existing damage with photos",
  "Wipe exterior of all appliances left behind",
  "Final walkthrough — all rooms",
  "Lock all windows before leaving",
  "Leave completed checklist with manager or client",
  "Take final photos of all rooms",
]

export async function GET() {
  const pdf = await PDFDocument.create()
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)

  let page = pdf.addPage([612, 792])
  let y = 750

  const addPage = () => { page = pdf.addPage([612, 792]); y = 750 }
  const checkY = (needed = 24) => { if (y < 60 + needed) addPage() }

  page.drawRectangle({ x: 0, y: 756, width: 612, height: 36, color: PRIMARY })
  page.drawText("CleanQuote Pro", { x: 24, y: 763, size: 14, font: bold, color: rgb(1,1,1) })
  page.drawText("quotecleaner.com", { x: 470, y: 763, size: 10, font: regular, color: rgb(1,1,1) })

  y = 720
  page.drawText("Move-In / Move-Out Cleaning Checklist", { x: 24, y, size: 20, font: bold, color: BLACK })
  y -= 20
  page.drawText("50-Point Vacancy Cleaning — Professional Template", { x: 24, y, size: 11, font: regular, color: GRAY })
  y -= 8
  page.drawLine({ start: { x: 24, y }, end: { x: 588, y }, thickness: 1, color: rgb(0.85,0.85,0.85) })
  y -= 18
  page.drawText("Property Address: _______________________", { x: 24, y, size: 10, font: regular, color: GRAY })
  page.drawText("Date: _______________", { x: 360, y, size: 10, font: regular, color: GRAY })
  y -= 16
  page.drawText("Client / PM: _________________________________", { x: 24, y, size: 10, font: regular, color: GRAY })
  page.drawText("Cleaner: _______________", { x: 360, y, size: 10, font: regular, color: GRAY })
  y -= 20

  const sections = [
    { title: "Kitchen", items: ITEMS.slice(0, 10) },
    { title: "Bathrooms", items: ITEMS.slice(10, 20) },
    { title: "Bedrooms & Living Areas", items: ITEMS.slice(20, 30) },
    { title: "Windows & Doors", items: ITEMS.slice(30, 40) },
    { title: "Final Checks", items: ITEMS.slice(40, 50) },
  ]

  for (const section of sections) {
    checkY(40)
    page.drawRectangle({ x: 24, y: y - 4, width: 564, height: 20, color: LIGHT })
    page.drawText(section.title.toUpperCase(), { x: 30, y, size: 9, font: bold, color: PRIMARY })
    y -= 22
    for (const item of section.items) {
      checkY(18)
      page.drawRectangle({ x: 30, y: y - 3, width: 11, height: 11, borderColor: rgb(0.6,0.6,0.6), borderWidth: 1, color: rgb(1,1,1) })
      page.drawText(item, { x: 48, y, size: 9.5, font: regular, color: BLACK })
      y -= 17
    }
    y -= 6
  }

  checkY(60)
  y -= 10
  page.drawLine({ start: { x: 24, y }, end: { x: 588, y }, thickness: 0.5, color: rgb(0.85,0.85,0.85) })
  y -= 20
  page.drawText("Notes:", { x: 24, y, size: 10, font: bold, color: BLACK })
  y -= 40
  page.drawLine({ start: { x: 24, y }, end: { x: 380, y }, thickness: 0.5, color: rgb(0.7,0.7,0.7) })
  y -= 20
  page.drawText("Cleaner Signature: _______________________", { x: 24, y, size: 10, font: regular, color: GRAY })
  page.drawText("Date: ______________", { x: 360, y, size: 10, font: regular, color: GRAY })

  const pages = pdf.getPages()
  pages.forEach((p, i) => {
    p.drawText(`Page ${i + 1} of ${pages.length}  |  CleanQuote Pro Move-In/Out Checklist  |  quotecleaner.com`, {
      x: 24, y: 18, size: 8, font: regular, color: GRAY,
    })
  })

  const bytes = await pdf.save()
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="move-in-out-cleaning-checklist.pdf"',
    },
  })
}
