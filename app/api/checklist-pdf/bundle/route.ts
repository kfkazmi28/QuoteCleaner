import { NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

const PRIMARY = rgb(0.118, 0.565, 0.502)
const BLACK = rgb(0.1, 0.1, 0.1)
const GRAY = rgb(0.45, 0.45, 0.45)
const LIGHT = rgb(0.96, 0.98, 0.97)
const WHITE = rgb(1, 1, 1)

const RESIDENTIAL_ITEMS = [
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

const DEEP_ITEMS = [
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

const MOVE_ITEMS = [
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

type SectionDef = { title: string; items: string[] }

async function buildSection(
  pdf: PDFDocument,
  bold: Awaited<ReturnType<typeof pdf.embedFont>>,
  regular: Awaited<ReturnType<typeof pdf.embedFont>>,
  sectionTitle: string,
  subtitle: string,
  clientLabel: string,
  sections: SectionDef[],
  sectionIndex: number,
  totalSections: number,
) {
  let page = pdf.addPage([612, 792])
  let y = 750

  const addPage = () => { page = pdf.addPage([612, 792]); y = 750 }
  const checkY = (needed = 24) => { if (y < 60 + needed) addPage() }

  // Header bar
  page.drawRectangle({ x: 0, y: 756, width: 612, height: 36, color: PRIMARY })
  page.drawText("CleanQuote Pro", { x: 24, y: 763, size: 14, font: bold, color: WHITE })
  page.drawText("quotecleaner.com", { x: 470, y: 763, size: 10, font: regular, color: WHITE })
  // Section badge
  page.drawText(`${sectionIndex} of ${totalSections}`, { x: 556, y: 780, size: 8, font: bold, color: WHITE })

  y = 720
  page.drawText(sectionTitle, { x: 24, y, size: 20, font: bold, color: BLACK })
  y -= 20
  page.drawText(subtitle, { x: 24, y, size: 11, font: regular, color: GRAY })
  y -= 8
  page.drawLine({ start: { x: 24, y }, end: { x: 588, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 18
  page.drawText(clientLabel, { x: 24, y, size: 10, font: regular, color: GRAY })
  page.drawText("Date: _______________", { x: 360, y, size: 10, font: regular, color: GRAY })
  y -= 16
  page.drawText("Address: ____________________________________", { x: 24, y, size: 10, font: regular, color: GRAY })
  page.drawText("Cleaner: _______________", { x: 360, y, size: 10, font: regular, color: GRAY })
  y -= 20

  for (const section of sections) {
    checkY(40)
    page.drawRectangle({ x: 24, y: y - 4, width: 564, height: 20, color: LIGHT })
    page.drawText(section.title.toUpperCase(), { x: 30, y, size: 9, font: bold, color: PRIMARY })
    y -= 22
    for (const item of section.items) {
      checkY(18)
      page.drawRectangle({ x: 30, y: y - 3, width: 11, height: 11, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 1, color: WHITE })
      page.drawText(item, { x: 48, y, size: 9.5, font: regular, color: BLACK })
      y -= 17
    }
    y -= 6
  }

  // Signature block
  checkY(60)
  y -= 10
  page.drawLine({ start: { x: 24, y }, end: { x: 588, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 20
  page.drawText("Notes:", { x: 24, y, size: 10, font: bold, color: BLACK })
  y -= 40
  page.drawLine({ start: { x: 24, y }, end: { x: 380, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
  y -= 20
  page.drawText("Cleaner Signature: _______________________", { x: 24, y, size: 10, font: regular, color: GRAY })
  page.drawText("Date: ______________", { x: 360, y, size: 10, font: regular, color: GRAY })
}

export async function GET() {
  const pdf = await PDFDocument.create()
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)

  // Section 1: Residential
  await buildSection(pdf, bold, regular,
    "Residential Cleaning Checklist",
    "50-Point Standard Cleaning — Professional Template",
    "Client Name: _________________________",
    [
      { title: "Living Areas", items: RESIDENTIAL_ITEMS.slice(0, 10) },
      { title: "Kitchen", items: RESIDENTIAL_ITEMS.slice(10, 20) },
      { title: "Bathrooms", items: RESIDENTIAL_ITEMS.slice(20, 30) },
      { title: "Bedrooms", items: RESIDENTIAL_ITEMS.slice(30, 40) },
      { title: "Final Checks", items: RESIDENTIAL_ITEMS.slice(40, 50) },
    ],
    1, 3,
  )

  // Section 2: Deep Clean
  await buildSection(pdf, bold, regular,
    "Deep Cleaning Checklist",
    "50-Point Thorough Deep Clean — Professional Template",
    "Client Name: _________________________",
    [
      { title: "Kitchen Deep Clean", items: DEEP_ITEMS.slice(0, 10) },
      { title: "Bathrooms Deep Clean", items: DEEP_ITEMS.slice(10, 20) },
      { title: "Bedroom & Living Areas", items: DEEP_ITEMS.slice(20, 30) },
      { title: "Windows & Surfaces", items: DEEP_ITEMS.slice(30, 40) },
      { title: "Final Checks", items: DEEP_ITEMS.slice(40, 50) },
    ],
    2, 3,
  )

  // Section 3: Move-In/Out
  await buildSection(pdf, bold, regular,
    "Move-In / Move-Out Cleaning Checklist",
    "50-Point Vacancy Cleaning — Professional Template",
    "Property Address: _______________________",
    [
      { title: "Kitchen", items: MOVE_ITEMS.slice(0, 10) },
      { title: "Bathrooms", items: MOVE_ITEMS.slice(10, 20) },
      { title: "Bedrooms & Living Areas", items: MOVE_ITEMS.slice(20, 30) },
      { title: "Windows & Doors", items: MOVE_ITEMS.slice(30, 40) },
      { title: "Final Checks", items: MOVE_ITEMS.slice(40, 50) },
    ],
    3, 3,
  )

  // Footer on all pages
  const pages = pdf.getPages()
  pages.forEach((p, i) => {
    p.drawText(`Page ${i + 1} of ${pages.length}  |  CleanQuote Pro Cleaning Checklist Bundle  |  quotecleaner.com`, {
      x: 24, y: 18, size: 8, font: regular, color: GRAY,
    })
  })

  const bytes = await pdf.save()
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="cleaning-checklist-bundle.pdf"',
    },
  })
}
