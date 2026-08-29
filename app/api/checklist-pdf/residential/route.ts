import { NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

const PRIMARY = rgb(0.118, 0.565, 0.502) // teal
const GOLD = rgb(0.72, 0.58, 0.18)
const BLACK = rgb(0.1, 0.1, 0.1)
const GRAY = rgb(0.45, 0.45, 0.45)
const LIGHT = rgb(0.96, 0.98, 0.97)

const ITEMS = [
  // Living Areas
  "Dust all surfaces including shelves and baseboards",
  "Vacuum all floors and area rugs",
  "Mop hard floors",
  "Clean mirrors and glass surfaces",
  "Wipe down light switches and door handles",
  "Empty and reline trash cans",
  "Dust ceiling fans and light fixtures",
  "Clean window sills and ledges",
  "Straighten furniture and cushions",
  "Remove cobwebs from corners",
  // Kitchen
  "Wipe down all countertops and backsplash",
  "Clean outside of all appliances",
  "Clean stovetop and drip pans",
  "Wipe inside and outside of microwave",
  "Clean sink and fixtures",
  "Wipe down cabinet doors and handles",
  "Clean inside of toaster oven",
  "Scrub and disinfect kitchen sink",
  "Take out kitchen trash",
  "Sweep and mop kitchen floor",
  // Bathrooms
  "Scrub and disinfect toilets (inside and out)",
  "Clean and shine sinks and faucets",
  "Scrub shower and tub",
  "Clean shower glass or curtain",
  "Wipe mirrors and chrome fixtures",
  "Wipe down all surfaces and countertops",
  "Sweep and mop bathroom floors",
  "Empty and reline trash can",
  "Replace toilet paper as needed",
  "Clean exhaust fan cover",
  // Bedrooms
  "Change bed linens (if requested)",
  "Dust all furniture surfaces",
  "Vacuum carpet or mop floors",
  "Wipe down nightstands and dressers",
  "Dust blinds and window treatments",
  "Clean mirrors",
  "Empty trash cans",
  "Organize visible items",
  "Vacuum under bed",
  "Wipe ceiling fan blades",
  // Final Checks
  "Wipe all doorknobs and light switches throughout",
  "Check all rooms for missed spots",
  "Straighten and tidy entryway",
  "Clean front door glass",
  "Leave client note if applicable",
  "Lock up property as instructed",
  "Take photos of completed work",
  "Log service in scheduling system",
  "Confirm all supplies packed up",
  "Mark job complete in system",
]

export async function GET() {
  const pdf = await PDFDocument.create()
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)

  let page = pdf.addPage([612, 792])
  let y = 750

  const addPage = () => {
    page = pdf.addPage([612, 792])
    y = 750
  }

  const checkY = (needed = 24) => {
    if (y < 60 + needed) addPage()
  }

  // Header
  page.drawRectangle({ x: 0, y: 756, width: 612, height: 36, color: PRIMARY })
  page.drawText("CleanQuote Pro", { x: 24, y: 763, size: 14, font: bold, color: rgb(1,1,1) })
  page.drawText("quotecleaner.com", { x: 470, y: 763, size: 10, font: regular, color: rgb(1,1,1) })

  y = 720
  page.drawText("Residential Cleaning Checklist", { x: 24, y, size: 22, font: bold, color: BLACK })
  y -= 20
  page.drawText("50-Point Standard Cleaning — Professional Template", { x: 24, y, size: 11, font: regular, color: GRAY })
  y -= 8
  page.drawLine({ start: { x: 24, y }, end: { x: 588, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })

  y -= 18
  // Client info row
  page.drawText("Client Name: _________________________", { x: 24, y, size: 10, font: regular, color: GRAY })
  page.drawText("Date: _______________", { x: 360, y, size: 10, font: regular, color: GRAY })
  y -= 16
  page.drawText("Address: ____________________________________", { x: 24, y, size: 10, font: regular, color: GRAY })
  page.drawText("Cleaner: _______________", { x: 360, y, size: 10, font: regular, color: GRAY })
  y -= 20

  const sections = [
    { title: "Living Areas", items: ITEMS.slice(0, 10) },
    { title: "Kitchen", items: ITEMS.slice(10, 20) },
    { title: "Bathrooms", items: ITEMS.slice(20, 30) },
    { title: "Bedrooms", items: ITEMS.slice(30, 40) },
    { title: "Final Checks", items: ITEMS.slice(40, 50) },
  ]

  for (const section of sections) {
    checkY(40)
    // Section header
    page.drawRectangle({ x: 24, y: y - 4, width: 564, height: 20, color: LIGHT })
    page.drawText(section.title.toUpperCase(), { x: 30, y, size: 9, font: bold, color: PRIMARY })
    y -= 22

    for (const item of section.items) {
      checkY(18)
      // Checkbox
      page.drawRectangle({ x: 30, y: y - 3, width: 11, height: 11, borderColor: rgb(0.6,0.6,0.6), borderWidth: 1, color: rgb(1,1,1) })
      page.drawText(item, { x: 48, y, size: 9.5, font: regular, color: BLACK })
      y -= 17
    }
    y -= 6
  }

  // Signature block
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

  // Footer on all pages
  const pages = pdf.getPages()
  pages.forEach((p, i) => {
    p.drawText(`Page ${i + 1} of ${pages.length}  |  CleanQuote Pro Residential Checklist  |  quotecleaner.com`, {
      x: 24, y: 18, size: 8, font: regular, color: GRAY,
    })
  })

  const bytes = await pdf.save()
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="residential-cleaning-checklist.pdf"',
    },
  })
}
