import { NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

const PRIMARY = rgb(0.118, 0.565, 0.502)
const BLACK = rgb(0.1, 0.1, 0.1)
const GRAY = rgb(0.45, 0.45, 0.45)
const LIGHT = rgb(0.96, 0.98, 0.97)

const ITEMS = [
  // Kitchen Deep Clean
  "Clean inside oven including racks and door glass",
  "Degrease stovetop burners and grates",
  "Clean inside refrigerator — all shelves and drawers",
  "Wipe top and sides of refrigerator",
  "Clean inside dishwasher including filter and door seal",
  "Degrease and clean exhaust hood and filter",
  "Wipe inside all cabinets and drawers",
  "Clean inside microwave thoroughly",
  "Scrub grout lines on tile backsplash",
  "Deep clean and disinfect sink and drain",
  // Bathrooms Deep Clean
  "Scrub grout lines on tile walls and floor",
  "Remove and clean showerhead of mineral buildup",
  "Clean behind and around toilet base",
  "Disinfect all surfaces with hospital-grade cleaner",
  "Clean inside medicine cabinet and vanity drawers",
  "Wash or replace shower curtain liner",
  "Clean exhaust fan blades and cover",
  "Scrub tub jets if applicable",
  "Wipe ceiling around shower for mold/mildew",
  "Deep clean and shine all chrome fixtures",
  // Bedroom / Living Deep Clean
  "Wash baseboards throughout entire home",
  "Clean inside all closets — walls, shelves, floors",
  "Dust all vents and air return covers",
  "Clean inside window tracks and frames",
  "Wipe down all blinds — each slat",
  "Dust tops of all doors and door frames",
  "Clean light switch plates and outlet covers",
  "Vacuum upholstered furniture including under cushions",
  "Clean under all furniture including beds and sofas",
  "Wipe down all walls for scuffs and marks",
  // Windows & Surfaces
  "Clean inside windows (all accessible)",
  "Wipe window sills and ledges — remove debris",
  "Clean interior of sliding door tracks",
  "Dust all artwork, photos, and wall decor",
  "Wipe all shelving units inside and out",
  "Clean front of all large appliances",
  "Dust tops of kitchen cabinets",
  "Disinfect all high-touch surfaces throughout",
  "Clean laundry area — machine fronts, top, sides",
  "Wipe washer and dryer drums inside",
  // Final
  "Deep vacuum all edges and corners",
  "Steam mop hard floors if available",
  "Disinfect all doorknobs throughout home",
  "Clean garage entry door and handle",
  "Replace HVAC filter (if provided)",
  "Deodorize carpets and soft surfaces",
  "Wipe all stairs — risers and balusters",
  "Check all rooms against checklist",
  "Take before and after photos",
  "Leave completed checklist with client",
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
  page.drawText("Deep Cleaning Checklist", { x: 24, y, size: 22, font: bold, color: BLACK })
  y -= 20
  page.drawText("50-Point Thorough Deep Clean — Professional Template", { x: 24, y, size: 11, font: regular, color: GRAY })
  y -= 8
  page.drawLine({ start: { x: 24, y }, end: { x: 588, y }, thickness: 1, color: rgb(0.85,0.85,0.85) })
  y -= 18
  page.drawText("Client Name: _________________________", { x: 24, y, size: 10, font: regular, color: GRAY })
  page.drawText("Date: _______________", { x: 360, y, size: 10, font: regular, color: GRAY })
  y -= 16
  page.drawText("Address: ____________________________________", { x: 24, y, size: 10, font: regular, color: GRAY })
  page.drawText("Cleaner: _______________", { x: 360, y, size: 10, font: regular, color: GRAY })
  y -= 20

  const sections = [
    { title: "Kitchen Deep Clean", items: ITEMS.slice(0, 10) },
    { title: "Bathrooms Deep Clean", items: ITEMS.slice(10, 20) },
    { title: "Bedroom & Living Areas", items: ITEMS.slice(20, 30) },
    { title: "Windows & Surfaces", items: ITEMS.slice(30, 40) },
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
    p.drawText(`Page ${i + 1} of ${pages.length}  |  CleanQuote Pro Deep Cleaning Checklist  |  quotecleaner.com`, {
      x: 24, y: 18, size: 8, font: regular, color: GRAY,
    })
  })

  const bytes = await pdf.save()
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="deep-cleaning-checklist.pdf"',
    },
  })
}
